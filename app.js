// CONFIGURAÇÃO DO SUPABASE (Substitua pelas suas credenciais do painel do Supabase)
const SUPABASE_URL = "https://xwmbdqhombbtfwpnxzzy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bWJkcWhvbWJidGZ3cG54enp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODA5NzAsImV4cCI6MjEwNTk1Njk3MH0.y2QOGi75QQe2bzKIwxVUcht9_9LhmW3DQgntu-vRDS0";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let dadosApp = {
    pontoHistorico: [],
    beconal: { cineseValores: [0, 0, 0, 0], aetTotal: 0, coletaTotal: 0, ddsTemas: [] },
    ems: {
        gravidasTotal: 0, gravidasAvaliadas: 0,
        pratTotal: 0, pratAvaliadas: 0,
        retornoTotal: 0, retornoAvaliadas: 0,
        queixasTotal: 0, queixasAvaliadas: 0
    },
    solar: { lapideTotal: 0, lapideFeitas: 0, inspecoesErgo: 0, ddsFeitos: 0, coergoRealizadas: 0 }
};

// Ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    verificarAlertas();
    await carregarDadosDoSupabase();
});

// Carrega os dados direto do Supabase
async function carregarDadosDoSupabase() {
    try {
        // 1. Buscar Pontos
        const { data: pontos, error: errPontos } = await _supabase.from('pontos').select('*');
        if (!errPontos && pontos) {
            dadosApp.pontoHistorico = pontos;
        }

        // 2. Buscar Atividades
        const { data: atividades, error: errAtiv } = await _supabase.from('atividades').select('*');
        if (!errAtiv && atividades) {
            atividades.forEach(a => {
                if (a.empresa === 'beconal') dadosApp.beconal = a.dados;
                if (a.empresa === 'ems') dadosApp.ems = a.dados;
                if (a.empresa === 'solar') dadosApp.solar = a.dados;
            });
        }

        atualizarTelaPonto();
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

// Alterna entre a visão de lançamentos e o Painel de Administração
function alternarVisao(visao) {
    const secOperacional = document.getElementById('secao-operacional');
    const secAdmin = document.getElementById('secao-admin');

    if (visao === 'admin') {
        secOperacional.classList.add('hidden');
        secAdmin.classList.remove('hidden');
        carregarPainelAdmin();
    } else {
        secAdmin.classList.add('hidden');
        secOperacional.classList.remove('hidden');
    }
}

function verificarAlertas() {
    const hoje = new Date();
    const dia = hoje.getDate();
    let avisos = [];

    if (dia >= 30 || dia <= 2) {
        avisos.push("Beconal: Emitir Nota Fiscal do mês!");
    }
    if (dia >= 7 && dia <= 10) {
        avisos.push("Beconal: Inserir Guia de INSS no Portal!");
    }

    const alertBar = document.getElementById('alert-bar');
    const alertMessage = document.getElementById('alert-message');

    if (avisos.length > 0 && !localStorage.getItem('avisoConfirmado')) {
        alertMessage.innerText = avisos.join(' | ');
        alertBar.classList.remove('hidden');
    }
}

function confirmarAviso() {
    localStorage.setItem('avisoConfirmado', 'true');
    document.getElementById('alert-bar').classList.add('hidden');
}

// Registrar Ponto no Supabase
async function registrarPonto() {
    const empresa = document.getElementById('ponto-empresa').value;
    const entrada = document.getElementById('ponto-entrada').value;
    const saida = document.getElementById('ponto-saida').value;

    if (!entrada || !saida) return alert('Por favor, informe entrada e saída.');

    const [hEntrada, mEntrada] = entrada.split(':').map(Number);
    const [hSaida, mSaida] = saida.split(':').map(Number);

    let diferencaMinutos = (hSaida * 60 + mSaida) - (hEntrada * 60 + mEntrada);
    if (diferencaMinutos < 0) diferencaMinutos += 24 * 60;

    if (diferencaMinutos === 0) return alert('Horários de entrada e saída não podem ser idênticos.');

    const horasCalculadas = Number((diferencaMinutos / 60).toFixed(2));
    const novoPonto = {
        empresa,
        data: new Date().toLocaleDateString('pt-BR'),
        entrada,
        saida,
        horas: horasCalculadas
    };

    const { data, error } = await _supabase.from('pontos').insert([novoPonto]).select();

    if (error) {
        // Mostra o erro detalhado no console para sabermos o que falhou
        console.error("Erro detalhado do Supabase:", error);
        alert(`Erro ao salvar no Supabase: ${error.message || error.details || 'Verifique o console'}`);
    } else {
        dadosApp.pontoHistorico.push(data[0]);
        document.getElementById('ponto-entrada').value = '';
        document.getElementById('ponto-saida').value = '';
        atualizarTelaPonto();
        alert('✅ Ponto salvo no Supabase com sucesso!');
    }
}

function atualizarTelaPonto() {
    const totais = { beconal: 0, ems: 0, solar: 0 };
    dadosApp.pontoHistorico.forEach(p => totais[p.empresa] += Number(p.horas));

    // Atualiza as horas registadas no ecrã (correção do ID aqui)
    document.getElementById('hrs-beconal').innerText = Number(totais.beconal.toFixed(2));
    document.getElementById('hrs-ems').innerText = Number(totais.ems.toFixed(2));
    document.getElementById('hrs-solar').innerText = Number(totais.solar.toFixed(2));

    // Saldo de folgas
    document.getElementById('folga-beconal').innerText = `${Math.max(0, Number((totais.beconal - 60).toFixed(2)))}h`;
    document.getElementById('folga-ems').innerText = `${Math.max(0, Number((totais.ems - 36).toFixed(2)))}h`;
    document.getElementById('folga-solar').innerText = `${Math.max(0, Number((totais.solar - 24).toFixed(2)))}h`;
}

function mudarAba(empresa) {
    document.querySelectorAll('.aba-btn').forEach(btn => btn.className = 'aba-btn text-xs md:text-sm font-bold py-1 px-3 rounded-lg bg-slate-200 text-slate-700');
    
    document.getElementById('form-beconal').classList.add('hidden');
    document.getElementById('form-ems').classList.add('hidden');
    document.getElementById('form-solar').classList.add('hidden');

    document.getElementById(`tab-${empresa}`).className = 'aba-btn text-xs md:text-sm font-bold py-1 px-3 rounded-lg bg-blue-900 text-white';
    document.getElementById(`form-${empresa}`).classList.remove('hidden');
}

// Salvar/Atualizar Atividades no Supabase
async function salvarAtividades() {
    // Beconal
    const sem = parseInt(document.getElementById('beconal-cinese-semana').value);
    const qtdCinese = parseInt(document.getElementById('beconal-cinese-qtd').value) || 0;
    dadosApp.beconal.cineseValores[sem] += qtdCinese;
    dadosApp.beconal.aetTotal += parseInt(document.getElementById('beconal-aet').value) || 0;
    dadosApp.beconal.coletaTotal += parseInt(document.getElementById('beconal-coleta').value) || 0;
    const ddsTema = document.getElementById('beconal-dds').value;
    if (ddsTema) dadosApp.beconal.ddsTemas.push(ddsTema);

    // EMS
    dadosApp.ems.gravidasTotal = parseInt(document.getElementById('ems-gravidas-total').value) || 0;
    dadosApp.ems.gravidasAvaliadas = parseInt(document.getElementById('ems-gravidas-avaliadas').value) || 0;
    dadosApp.ems.pratTotal = parseInt(document.getElementById('ems-prat-total').value) || 0;
    dadosApp.ems.pratAvaliadas = parseInt(document.getElementById('ems-prat-avaliadas').value) || 0;
    dadosApp.ems.retornoTotal = parseInt(document.getElementById('ems-retorno-total').value) || 0;
    dadosApp.ems.retornoAvaliadas = parseInt(document.getElementById('ems-retorno-avaliadas').value) || 0;
    dadosApp.ems.queixasTotal = parseInt(document.getElementById('ems-queixas-total').value) || 0;
    dadosApp.ems.queixasAvaliadas = parseInt(document.getElementById('ems-queixas-avaliadas').value) || 0;

    // Solar
    dadosApp.solar.lapideTotal = parseInt(document.getElementById('solar-lapide-total').value) || 0;
    dadosApp.solar.lapideFeitas = parseInt(document.getElementById('solar-lapide-feitas').value) || 0;
    dadosApp.solar.inspecoesErgo = parseInt(document.getElementById('solar-inspecoes').value) || 0;
    dadosApp.solar.ddsFeitos = parseInt(document.getElementById('solar-dds').value) || 0;
    dadosApp.solar.coergoRealizadas = parseInt(document.getElementById('solar-coergo').value) || 0;

    await _supabase.from('atividades').upsert([
        { empresa: 'beconal', dados: dadosApp.beconal },
        { empresa: 'ems', dados: dadosApp.ems },
        { empresa: 'solar', dados: dadosApp.solar }
    ], { onConflict: 'empresa' });

    alert('✅ Registros salvos no Supabase!');
}

function carregarPainelAdmin() {
    const tbPonto = document.getElementById('tabela-admin-ponto');
    tbPonto.innerHTML = '';

    if (dadosApp.pontoHistorico.length === 0) {
        tbPonto.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-slate-400">Nenhum ponto registrado.</td></tr>';
    } else {
        dadosApp.pontoHistorico.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-slate-50';
            tr.innerHTML = `
                <td class="p-2 font-bold capitalize">${p.empresa}</td>
                <td class="p-2">${p.data}</td>
                <td class="p-2">${p.entrada}</td>
                <td class="p-2">${p.saida}</td>
                <td class="p-2 font-bold text-emerald-600">${p.horas}h</td>
                <td class="p-2 text-right">
                    <button onclick="excluirPonto(${p.id})" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">Excluir</button>
                </td>
            `;
            tbPonto.appendChild(tr);
        });
    }

    // Beconal Admin
    document.getElementById('admin-beconal-container').innerHTML = `
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">AET Concluídas</label>
            <input type="number" value="${dadosApp.beconal.aetTotal}" onchange="dadosApp.beconal.aetTotal = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded w-full">
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Coletas de Dados AET</label>
            <input type="number" value="${dadosApp.beconal.coletaTotal}" onchange="dadosApp.beconal.coletaTotal = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded w-full">
        </div>
    `;

    // EMS Admin
    document.getElementById('admin-ems-container').innerHTML = `
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Grávidas (Tem / Avaliei)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.ems.gravidasTotal}" onchange="dadosApp.ems.gravidasTotal = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
                <input type="number" value="${dadosApp.ems.gravidasAvaliadas}" onchange="dadosApp.ems.gravidasAvaliadas = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">PRAT / Restrito (Tem / Avaliei)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.ems.pratTotal}" onchange="dadosApp.ems.pratTotal = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
                <input type="number" value="${dadosApp.ems.pratAvaliadas}" onchange="dadosApp.ems.pratAvaliadas = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Retorno ao Trabalho (Tem / Avaliei)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.ems.retornoTotal}" onchange="dadosApp.ems.retornoTotal = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
                <input type="number" value="${dadosApp.ems.retornoAvaliadas}" onchange="dadosApp.ems.retornoAvaliadas = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Investigação de Queixa (Tem / Avaliei)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.ems.queixasTotal}" onchange="dadosApp.ems.queixasTotal = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
                <input type="number" value="${dadosApp.ems.queixasAvaliadas}" onchange="dadosApp.ems.queixasAvaliadas = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
            </div>
        </div>
    `;

    // Solar Admin
    document.getElementById('admin-solar-container').innerHTML = `
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Revisão Lapide (Tem / Fiz)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.solar.lapideTotal}" onchange="dadosApp.solar.lapideTotal = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
                <input type="number" value="${dadosApp.solar.lapideFeitas}" onchange="dadosApp.solar.lapideFeitas = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Inspeções e DDS (Inspeções / DDS)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.solar.inspecoesErgo}" onchange="dadosApp.solar.inspecoesErgo = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
                <input type="number" value="${dadosApp.solar.ddsFeitos}" onchange="dadosApp.solar.ddsFeitos = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50 col-span-1 md:col-span-2">
            <label class="font-bold block mb-1">CoErgo (Realizadas no ano)</label>
            <input type="number" value="${dadosApp.solar.coergoRealizadas}" onchange="dadosApp.solar.coergoRealizadas = parseInt(this.value)||0; salvarAtividadesAdmin();" class="p-1 border rounded w-full">
        </div>
    `;
}

// Função auxiliar silenciosa para salvar alterações feitas direto no Admin
async function salvarAtividadesAdmin() {
    await _supabase.from('atividades').upsert([
        { empresa: 'beconal', dados: dadosApp.beconal },
        { empresa: 'ems', dados: dadosApp.ems },
        { empresa: 'solar', dados: dadosApp.solar }
    ], { onConflict: 'empresa' });
}

async function excluirPonto(id) {
    if (confirm('Excluir este ponto do banco de dados?')) {
        await _supabase.from('pontos').delete().eq('id', id);
        dadosApp.pontoHistorico = dadosApp.pontoHistorico.filter(p => p.id !== id);
        carregarPainelAdmin();
        atualizarTelaPonto();
    }
}

// CORREÇÃO: Nome unificado para gerarRelatorioPPTX (conforme chamado no HTML)
async function gerarRelatorioPPTX() {
    let pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const COR_AZUL_ESCURO = "1E3A8A";
    const COR_BRANCO = "FFFFFF";
    const COR_CINZA_TEXTO = "334155";

    // 1. Slide de Capa
    let slideCapa = pptx.addSlide();
    slideCapa.background = { color: COR_AZUL_ESCURO };
    
    slideCapa.addText("Relatório Mensal de Gestão e Ergonomia", {
        x: 0.8, y: 2.2, w: '85%', h: 1.2,
        fontSize: 32, bold: true, color: COR_BRANCO
    });
    slideCapa.addText(`Mês de Referência: ${new Date().getMonth() + 1}/${new Date().getFullYear()}`, {
        x: 0.8, y: 3.6, w: '85%', h: 0.5,
        fontSize: 16, color: "93C5FD"
    });

    // 2. Slide Extra: Resumo de Banco de Horas
    let slideBancoHoras = pptx.addSlide();
    slideBancoHoras.addText("Resumo de Banco de Horas", {
        x: 0.6, y: 0.5, w: 9, h: 0.6,
        fontSize: 22, bold: true, color: COR_AZUL_ESCURO
    });

    let dadosHorasTabela = [
        [
            { text: "Empresa", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } },
            { text: "Registradas", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } },
            { text: "Meta Mensal", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } }
        ],
        ["Beconal (3h/dia)", `${document.getElementById('hrs-beconal').innerText}h`, "60h"],
        ["Grupo EMS (3x/sem)", `${document.getElementById('hrs-ems').innerText}h`, "36h"],
        ["Solar Coca-Cola (1x/sem)", `${document.getElementById('hrs-solar').innerText}h`, "24h"]
    ];

    slideBancoHoras.addTable(dadosHorasTabela, {
        x: 0.6, y: 1.5, w: 8.8,
        border: { pt: 1, color: "CBD5E1" },
        colW: [4.4, 2.2, 2.2],
        fontSz: 12
    });

    // 3. Slide: Beconal - Resumo de Atividades
    let slideBeconal = pptx.addSlide();
    slideBeconal.addText("1ª Empresa: Beconal - Resumo de Atividades", {
        x: 0.6, y: 0.5, w: 9, h: 0.6,
        fontSize: 22, bold: true, color: COR_AZUL_ESCURO
    });

    let dadosBeconalTabela = [
        [
            { text: "Atividade", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } },
            { text: "Quantidade Total", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } }
        ],
        ["AETs Concluídas", dadosApp.beconal.aetTotal || 0],
        ["Coletas de Dados AET", dadosApp.beconal.coletaTotal || 0],
        ["Temas de DDS Abordados", dadosApp.beconal.ddsTemas.length > 0 ? dadosApp.beconal.ddsTemas[dadosApp.beconal.ddsTemas.length - 1] : "Nenhum registrado"]
    ];

    slideBeconal.addTable(dadosBeconalTabela, {
        x: 0.6, y: 1.3, w: 8.8,
        border: { pt: 1, color: "CBD5E1" },
        colW: [5.8, 3.0],
        fontSz: 12
    });

    // 4. Slide: Grupo EMS - Mapeamento e Pendências
    let slideEms = pptx.addSlide();
    slideEms.addText("2ª Empresa: Grupo EMS - Mapeamento e Pendências", {
        x: 0.6, y: 0.5, w: 9, h: 0.6,
        fontSize: 22, bold: true, color: COR_AZUL_ESCURO
    });

    let dadosEmsTabela = [
        [
            { text: "Categoria", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } },
            { text: "Existentes", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } },
            { text: "Avaliados", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } },
            { text: "Pendentes", options: { bold: true, fill: "DC2626", color: COR_BRANCO } }
        ],
        ["Grávidas", dadosApp.ems.gravidasTotal, dadosApp.ems.gravidasAvaliadas, Math.max(0, dadosApp.ems.gravidasTotal - dadosApp.ems.gravidasAvaliadas)],
        ["PRAT / Restrito", dadosApp.ems.pratTotal, dadosApp.ems.pratAvaliadas, Math.max(0, dadosApp.ems.pratTotal - dadosApp.ems.pratAvaliadas)],
        ["Retorno ao Trabalho", dadosApp.ems.retornoTotal, dadosApp.ems.retornoAvaliadas, Math.max(0, dadosApp.ems.retornoTotal - dadosApp.ems.retornoAvaliadas)],
        ["Investigação de Queixa", dadosApp.ems.queixasTotal, dadosApp.ems.queixasAvaliadas, Math.max(0, dadosApp.ems.queixasTotal - dadosApp.ems.queixasAvaliadas)]
    ];

    slideEms.addTable(dadosEmsTabela, {
        x: 0.6, y: 1.5, w: 8.8,
        border: { pt: 1, color: "CBD5E1" },
        colW: [3.2, 1.8, 1.8, 2.0],
        fontSz: 12
    });

    // 5. Slide: Solar Coca-Cola
    let slideSolar = pptx.addSlide();
    slideSolar.addText("3ª Empresa: Solar Coca-Cola", {
        x: 0.6, y: 0.5, w: 9, h: 0.6,
        fontSize: 22, bold: true, color: COR_AZUL_ESCURO
    });

    let pendentesLapide = Math.max(0, dadosApp.solar.lapideTotal - dadosApp.solar.lapideFeitas);
    let dadosSolarTabela = [
        [
            { text: "Indicador", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } },
            { text: "Quantidade", options: { bold: true, fill: COR_AZUL_ESCURO, color: COR_BRANCO } }
        ],
        ["Revisão Lapide - Total Que Tem", dadosApp.solar.lapideTotal],
        ["Revisão Lapide - Realizadas", dadosApp.solar.lapideFeitas],
        ["Revisão Lapide - Pendentes", pendentesLapide],
        ["Inspeções ERGO Realizadas", dadosApp.solar.inspecoesErgo],
        ["DDS Realizados", dadosApp.solar.ddsFeitos]
    ];

    slideSolar.addTable(dadosSolarTabela, {
        x: 0.6, y: 1.3, w: 5.5,
        border: { pt: 1, color: "CBD5E1" },
        colW: [3.5, 2.0],
        fontSz: 11
    });

    let progressoCoErgo = dadosApp.solar.coergoRealizadas ? Math.min(100, Math.round((dadosApp.solar.coergoRealizadas / 12) * 100)) : 0;
    slideSolar.addText(`Progresso CoErgo Anual: ${progressoCoErgo}%`, {
        x: 6.4, y: 2.5, w: 3.0, h: 0.8,
        fontSize: 16, bold: true, color: COR_CINZA_TEXTO, align: "center"
    });

    await pptx.writeFile({ fileName: `Relatorio_ErgoControl_${Date.now()}.pptx` });
}