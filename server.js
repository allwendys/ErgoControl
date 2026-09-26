const express = require('express');
const PptxGenJS = require('pptxgenjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota para gerar o PowerPoint
app.post('/api/gerar-pptx', async (req, res) => {
    try {
        const dados = req.body;
        let pptx = new PptxGenJS();
        
        // Define o layout Widescreen padrão do PowerPoint (13.333 x 7.5 polegadas)
        pptx.defineLayout({ name: 'WIDESCREEN_16_9', width: 13.333, height: 7.5 });
        pptx.layout = 'WIDESCREEN_16_9';

        const COR_AZUL = '1E3A8A';
        const COR_VERDE = '16A34A';

        // SLIDE 1: Capa
        let slide1 = pptx.addSlide();
        slide1.background = { fill: COR_AZUL };
        slide1.addText("Relatório Mensal de Gestão e Ergonomia", { 
            x: 1.0, y: 2.4, w: 11.3, h: 1.2, fontSize: 32, color: 'FFFFFF', bold: true 
        });
        slide1.addText(`Mês de Referência: ${dados.mesAno || 'Corrente'}`, { 
            x: 1.0, y: 3.6, w: 11.3, h: 0.8, fontSize: 18, color: '93C5FD' 
        });

        // SLIDE 2: Beconal
        let slide2 = pptx.addSlide();
        slide2.addText("1ª Empresa: Beconal - Resumo de Atividades", { 
            x: 0.8, y: 0.5, w: 11.7, h: 0.6, fontSize: 20, bold: true, color: COR_AZUL 
        });
        
        // Tabela Beconal (Esquerda)
        slide2.addTable([
            [{ text: "Atividade", options: { bold: true, fill: COR_AZUL, color: 'FFFFFF' } }, 
             { text: "Quantidade Total", options: { bold: true, fill: COR_AZUL, color: 'FFFFFF' } }],
            ["AETs Concluídas", dados.beconal?.aetTotal || 0],
            ["Coletas de Dados AET", dados.beconal?.coletaTotal || 0],
            ["Temas de DDS Abordados", (dados.beconal?.ddsTemas || []).join(', ') || 'Nenhum registrado']
        ], { 
            x: 0.8, y: 1.5, w: 5.5, h: 4.5,
            colW: [3.5, 2.0],
            fontSize: 12,
            valign: 'middle'
        });

        // Gráfico Cinese Beconal (Direita)
        const cineseBeconal = dados.beconal?.cineseValores || [0, 0, 0, 0];
        slide2.addChart(pptx.ChartType.bar, [
            {
                name: "Sessões Cinese",
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                values: cineseBeconal
            }
        ], { 
            x: 6.8, y: 1.4, w: 5.7, h: 5.2, 
            chartColors: [COR_AZUL], 
            showTitle: true, 
            title: "Cinese por Semana (Beconal)",
            titleFontSize: 13,
            valAxisMaxVal: 1,
            valAxisMajorUnit: 0.1
        });

        // SLIDE 3: Grupo ENS
        let slide3 = pptx.addSlide();
        slide3.addText("2ª Empresa: Grupo ENS - Mapeamento e Pendências", { 
            x: 0.8, y: 0.5, w: 11.7, h: 0.6, fontSize: 20, bold: true, color: COR_AZUL 
        });

        const ens = dados.ens || {};
        slide3.addTable([
            [
                { text: "Categoria", options: { bold: true, fill: COR_AZUL, color: 'FFFFFF' } },
                { text: "Existentes", options: { bold: true, fill: COR_AZUL, color: 'FFFFFF' } },
                { text: "Avaliados", options: { bold: true, fill: COR_AZUL, color: 'FFFFFF' } },
                { text: "Pendentes", options: { bold: true, fill: 'DC2626', color: 'FFFFFF' } }
            ],
            ["Grávidas", ens.gravidasTotal || 0, ens.gravidasAvaliadas || 0, (ens.gravidasTotal || 0) - (ens.gravidasAvaliadas || 0)],
            ["PRAT / Restrito", ens.pratTotal || 0, ens.pratAvaliadas || 0, (ens.pratTotal || 0) - (ens.pratAvaliadas || 0)],
            ["Retorno ao Trabalho", ens.retornoTotal || 0, ens.retornoAvaliadas || 0, (ens.retornoTotal || 0) - (ens.retornoAvaliadas || 0)],
            ["Investigação de Queixa", ens.queixasTotal || 0, ens.queixasAvaliadas || 0, (ens.queixasTotal || 0) - (ens.queixasAvaliadas || 0)]
        ], { 
            x: 0.8, y: 1.5, w: 11.7, h: 4.5,
            colW: [4.5, 2.4, 2.4, 2.4],
            fontSize: 12,
            valign: 'middle'
        });

        // SLIDE 4: Solar Coca-Cola
        let slide4 = pptx.addSlide();
        slide4.addText("3ª Empresa: Solar Coca-Cola", { 
            x: 0.8, y: 0.5, w: 11.7, h: 0.6, fontSize: 20, bold: true, color: COR_AZUL 
        });

        const solar = dados.solar || {};
        slide4.addTable([
            [{ text: "Indicador", options: { bold: true, fill: COR_AZUL, color: 'FFFFFF' } }, { text: "Quantidade", options: { bold: true, fill: COR_AZUL, color: 'FFFFFF' } }],
            ["Revisão Lapide - Total Que Tem", solar.lapideTotal || 0],
            ["Revisão Lapide - Realizadas", solar.lapideFeitas || 0],
            ["Revisão Lapide - Pendentes", (solar.lapideTotal || 0) - (solar.lapideFeitas || 0)],
            ["Inspeções ERGO Realizadas", solar.inspecoesErgo || 0],
            ["DDS Realizados", solar.ddsFeitos || 0]
        ], { 
            x: 0.8, y: 1.5, w: 5.8, h: 5.0,
            colW: [4.2, 1.6],
            fontSize: 11,
            valign: 'middle'
        });

        const coergoRealizadas = solar.coergoRealizadas || 0;
        const pctCoergo = Number(((coergoRealizadas / 3) * 100).toFixed(1));

        slide4.addChart(pptx.ChartType.doughnut, [
            {
                name: "Progresso CoErgo",
                labels: ["Realizado", "Pendente"],
                values: [pctCoergo, Math.max(0, 100 - pctCoergo)]
            }
        ], { 
            x: 7.0, y: 1.4, w: 5.5, h: 5.2, 
            chartColors: [COR_VERDE, 'E5E7EB'], 
            showTitle: true, 
            title: `Progresso CoErgo Anual: ${pctCoergo}%`,
            titleFontSize: 13
        });

        // Enviar o arquivo gerado
        const buffer = await pptx.stream();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Empresas_${Date.now()}.pptx`);
        res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao gerar apresentação." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});