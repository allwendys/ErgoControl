// Estado local da aplicação com histórico de pontos em lista
let dadosApp = {
    pontoHistorico: [], // Armazena cada batida de ponto individual { id, empresa, data, entrada, saída, horas }
    beconal: { cineseValores: [0, 0, 0, 0], aetTotal: 0, coletaTotal: 0, ddsTemas: [] },
    ens: {
        gravidasTotal: 0, gravidasAvaliadas: 0,
        pratTotal: 0, pratAvaliadas: 0,
        retornoTotal: 0, retornoAvaliadas: 0,
        queixasTotal: 0, queixasAvaliadas: 0
    },
    solar: { lapideTotal: 0, lapideFeitas: 0, inspecoesErgo: 0, ddsFeitos: 0, coergoRealizadas: 0 }
};

// Ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    verificarAlertas();
    atualizarTelaPonto();
});

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

// Checa os avisos configurados baseados no dia atual
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

// Lógica de Registro de Ponto
function registrarPonto() {
    const empresa = document.getElementById('ponto-empresa').value;
    const entrada = document.getElementById('ponto-entrada').value;
    const saida = document.getElementById('ponto-saida').value;

    if (!entrada || !saida) {
        return alert('Por favor, informe os horários de entrada e saída.');
    }

    const [hEntrada, mEntrada] = entrada.split(':').map(Number);
    const [hSaida, mSaida] = saida.split(':').map(Number);

    let diferencaMinutos = (hSaida * 60 + mSaida) - (hEntrada * 60 + mEntrada);
    if (diferencaMinutos < 0) diferencaMinutos += 24 * 60; // Trata virada de dia

    if (diferencaMinutos === 0) return alert('Horários de entrada e saída não podem ser idênticos.');

    const horasCalculadas = Number((diferencaMinutos / 60).toFixed(2));

    // Salva o registro no histórico
    dadosApp.pontoHistorico.push({
        id: Date.now(),
        empresa: empresa,
        data: new Date().toLocaleDateString('pt-BR'),
        entrada: entrada,
        saida: saida,
        horas: horasCalculadas
    });

    document.getElementById('ponto-entrada').value = '';
    document.getElementById('ponto-saida').value = '';

    atualizarTelaPonto();
    alert('✅ Ponto registrado com sucesso!');
}

function atualizarTelaPonto() {
    // Soma total de horas por empresa
    const totais = { beconal: 0, ens: 0, solar: 0 };
    dadosApp.pontoHistorico.forEach(p => totais[p.empresa] += p.horas);

    document.getElementById('hrs-beconal').innerText = Number(totais.beconal.toFixed(2));
    document.getElementById('hrs-ens').innerText = Number(totais.ens.toFixed(2));
    document.getElementById('hrs-solar').innerText = Number(totais.solar.toFixed(2));

    // Regras de Folga
    document.getElementById('folga-beconal').innerText = `${Math.max(0, Number((totais.beconal - 60).toFixed(2)))}h`;
    document.getElementById('folga-ens').innerText = `${Math.max(0, Number((totais.ens - 36).toFixed(2)))}h`;
    document.getElementById('folga-solar').innerText = `${Math.max(0, Number((totais.solar - 24).toFixed(2)))}h`;
}

// Controle de Abas
function mudarAba(empresa) {
    document.querySelectorAll('.aba-btn').forEach(btn => btn.className = 'aba-btn text-xs md:text-sm font-bold py-1 px-3 rounded-lg bg-slate-200 text-slate-700');
    
    document.getElementById('form-beconal').classList.add('hidden');
    document.getElementById('form-ens').classList.add('hidden');
    document.getElementById('form-solar').classList.add('hidden');

    document.getElementById(`tab-${empresa}`).className = 'aba-btn text-xs md:text-sm font-bold py-1 px-3 rounded-lg bg-blue-900 text-white';
    document.getElementById(`form-${empresa}`).classList.remove('hidden');
}

// Salvar Formulários das Empresas
function salvarAtividades() {
    // Beconal
    const sem = parseInt(document.getElementById('beconal-cinese-semana').value);
    const qtdCinese = parseInt(document.getElementById('beconal-cinese-qtd').value) || 0;
    dadosApp.beconal.cineseValores[sem] += qtdCinese;

    dadosApp.beconal.aetTotal += parseInt(document.getElementById('beconal-aet').value) || 0;
    dadosApp.beconal.coletaTotal += parseInt(document.getElementById('beconal-coleta').value) || 0;
    
    const ddsTema = document.getElementById('beconal-dds').value;
    if (ddsTema) dadosApp.beconal.ddsTemas.push(ddsTema);

    // ENS
    dadosApp.ens.gravidasTotal = parseInt(document.getElementById('ens-gravidas-total').value) || 0;
    dadosApp.ens.gravidasAvaliadas = parseInt(document.getElementById('ens-gravidas-avaliadas').value) || 0;
    dadosApp.ens.pratTotal = parseInt(document.getElementById('ens-prat-total').value) || 0;
    dadosApp.ens.pratAvaliadas = parseInt(document.getElementById('ens-prat-avaliadas').value) || 0;
    dadosApp.ens.retornoTotal = parseInt(document.getElementById('ens-retorno-total').value) || 0;
    dadosApp.ens.retornoAvaliadas = parseInt(document.getElementById('ens-retorno-avaliadas').value) || 0;
    dadosApp.ens.queixasTotal = parseInt(document.getElementById('ens-queixas-total').value) || 0;
    dadosApp.ens.queixasAvaliadas = parseInt(document.getElementById('ens-queixas-avaliadas').value) || 0;

    // Solar
    dadosApp.solar.lapideTotal = parseInt(document.getElementById('solar-lapide-total').value) || 0;
    dadosApp.solar.lapideFeitas = parseInt(document.getElementById('solar-lapide-feitas').value) || 0;
    dadosApp.solar.inspecoesErgo = parseInt(document.getElementById('solar-inspecoes').value) || 0;
    dadosApp.solar.ddsFeitos = parseInt(document.getElementById('solar-dds').value) || 0;
    dadosApp.solar.coergoRealizadas = parseInt(document.getElementById('solar-coergo').value) || 0;

    alert('✅ Registros salvos com sucesso!');
}

// ================= PAINEL ADMIN: RENDERIZAR E EDITAR DADOS =================

function carregarPainelAdmin() {
    // 1. Tabela de Pontos
    const tbPonto = document.getElementById('tabela-admin-ponto');
    tbPonto.innerHTML = '';

    if (dadosApp.pontoHistorico.length === 0) {
        tbPonto.innerHTML = '<tr><td colspan="6" class="p-3 text-center text-slate-400">Nenhum registro de ponto lançado ainda.</td></tr>';
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

    // 2. Beconal Admin Campos
    const bContainer = document.getElementById('admin-beconal-container');
    bContainer.innerHTML = `
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">AET Concluídas (Total)</label>
            <input type="number" value="${dadosApp.beconal.aetTotal}" onchange="dadosApp.beconal.aetTotal = parseInt(this.value) || 0" class="p-1 border rounded w-full">
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Coletas de Dados AET (Total)</label>
            <input type="number" value="${dadosApp.beconal.coletaTotal}" onchange="dadosApp.beconal.coletaTotal = parseInt(this.value) || 0" class="p-1 border rounded w-full">
        </div>
        <div class="p-2 border rounded bg-slate-50 col-span-1 md:col-span-2">
            <label class="font-bold block mb-1">Cinese por Semana [Sem 1, Sem 2, Sem 3, Sem 4]</label>
            <div class="grid grid-cols-4 gap-2">
                ${dadosApp.beconal.cineseValores.map((v, idx) => `
                    <input type="number" value="${v}" onchange="dadosApp.beconal.cineseValores[${idx}] = parseInt(this.value) || 0" class="p-1 border rounded text-center">
                `).join('')}
            </div>
        </div>
    `;

    // 3. ENS Admin Campos
    const ensContainer = document.getElementById('admin-ens-container');
    ensContainer.innerHTML = `
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Grávidas (Tem / Avaliei)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.ens.gravidasTotal}" onchange="dadosApp.ens.gravidasTotal = parseInt(this.value)||0" class="p-1 border rounded">
                <input type="number" value="${dadosApp.ens.gravidasAvaliadas}" onchange="dadosApp.ens.gravidasAvaliadas = parseInt(this.value)||0" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">PRAT / Restrito (Tem / Avaliei)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.ens.pratTotal}" onchange="dadosApp.ens.pratTotal = parseInt(this.value)||0" class="p-1 border rounded">
                <input type="number" value="${dadosApp.ens.pratAvaliadas}" onchange="dadosApp.ens.pratAvaliadas = parseInt(this.value)||0" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Retorno ao Trabalho (Tem / Avaliei)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.ens.retornoTotal}" onchange="dadosApp.ens.retornoTotal = parseInt(this.value)||0" class="p-1 border rounded">
                <input type="number" value="${dadosApp.ens.retornoAvaliadas}" onchange="dadosApp.ens.retornoAvaliadas = parseInt(this.value)||0" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Investigação Queixa (Tem / Avaliei)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.ens.queixasTotal}" onchange="dadosApp.ens.queixasTotal = parseInt(this.value)||0" class="p-1 border rounded">
                <input type="number" value="${dadosApp.ens.queixasAvaliadas}" onchange="dadosApp.ens.queixasAvaliadas = parseInt(this.value)||0" class="p-1 border rounded">
            </div>
        </div>
    `;

    // 4. Solar Admin Campos
    const solarContainer = document.getElementById('admin-solar-container');
    solarContainer.innerHTML = `
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Revisão Lapide (Tem / Fiz)</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.solar.lapideTotal}" onchange="dadosApp.solar.lapideTotal = parseInt(this.value)||0" class="p-1 border rounded">
                <input type="number" value="${dadosApp.solar.lapideFeitas}" onchange="dadosApp.solar.lapideFeitas = parseInt(this.value)||0" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50">
            <label class="font-bold block mb-1">Inspeções ERGO e DDS Fiz</label>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" value="${dadosApp.solar.inspecoesErgo}" onchange="dadosApp.solar.inspecoesErgo = parseInt(this.value)||0" class="p-1 border rounded">
                <input type="number" value="${dadosApp.solar.ddsFeitos}" onchange="dadosApp.solar.ddsFeitos = parseInt(this.value)||0" class="p-1 border rounded">
            </div>
        </div>
        <div class="p-2 border rounded bg-slate-50 col-span-1 md:col-span-2">
            <label class="font-bold block mb-1">CoErgo Realizadas no Ano (meta de 3)</label>
            <input type="number" value="${dadosApp.solar.coergoRealizadas}" onchange="dadosApp.solar.coergoRealizadas = parseInt(this.value)||0" class="p-1 border rounded w-full">
        </div>
    `;
}

function excluirPonto(id) {
    if (confirm('Deseja realmente excluir este lançamento de ponto?')) {
        dadosApp.pontoHistorico = dadosApp.pontoHistorico.filter(p => p.id !== id);
        carregarPainelAdmin();
        atualizarTelaPonto();
    }
}

// Chamada para o Servidor fazer o download do PPTX
async function exportarPPTX() {
    const dataAtual = new Date();
    dadosApp.mesAno = `${dataAtual.getMonth() + 1}/${dataAtual.getFullYear()}`;

    // Monta o objeto formatado esperado pelo backend
    const payload = {
        mesAno: dadosApp.mesAno,
        beconal: dadosApp.beconal,
        ens: dadosApp.ens,
        solar: dadosApp.solar
    };

    const res = await fetch('/api/gerar-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio_Empresas_${Date.now()}.pptx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } else {
        alert('Erro ao gerar apresentação!');
    }
}