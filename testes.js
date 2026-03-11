
    function calcularTributos(ano, receita, custos, despesas, tipo, cbsAno, ibsAno) {

        let icms = tipo === "vendas" ? 0.19 : 0;
        let iss = tipo === "servicos" ? 0.05 : 0;

        let pis = 0, cofins = 0, ibs = 0, cbs = 0;

        if (ano === 2025) {
            pis = 0.0165;
            cofins = 0.076;
        }

        if (ano === 2026) {
            pis = 0.0165;
            cofins = 0.076;
            ibs = 0.000;
            cbs = 0.000;
        }

        if (ano >= 2027 && ano <= 2028) {
            ibs = 0.001;
            cbs = cbsAno;
        }

        if (ano >= 2029 && ano <= 2032) {
            let fator = (ano - 2028) * 0.10;
            let baseIBS = (receita - custos - despesas);

            ibs = (ibsAno * fator);
            icms *= (1 - fator);
            iss *= (1 - fator);
            cbs = cbsAno;
        }

        if (ano === 2033) {
            ibs = ibsAno;
            icms = 0;
            iss = 0;
            cbs = cbsAno;
        }

        const debICMS_ISS = receita * (icms + iss);
        const debPIS = [receita - (receita * 0.19)] * pis;
        const debCOFINS = [receita - (receita * 0.19)] * cofins;
        const debIBS = receita * ibs;
        const debCBS = receita * cbs;

        const baseCred = custos + despesas;

        const credPIS = baseCred * pis;
        const credCOFINS = baseCred * cofins;
        const credICMS = baseCred * icms;
        const credIBS = baseCred * ibs;
        const credCBS = baseCred * cbs;

        const pisCofinsLiquido = (debPIS + debCOFINS) - (credPIS + credCOFINS);
        const icmsissLiquido = debICMS_ISS - credICMS;

        let ibsLiquido = debIBS - credIBS;

        if (tipo === "servicos") {
            if (ano === 2025) {
                ibsLiquido = 0;
            }

            if (ano === 2026) {
                ibsLiquido = 0.001 * (receita - baseCred);
            }

            if (ano >= 2029) {
                const redutores = { 2029: 0.90, 2030: 0.80, 2031: 0.70, 2032: 0.60, 2033: 0.00 };
                ibsLiquido = [(1 - redutores[ano]) * ibsAno] * (receita - baseCred);
            }
        }

        const cbsLiquido = debCBS - credCBS;
        let totalTributos = icmsissLiquido + pisCofinsLiquido + ibsLiquido + cbsLiquido;

        if (ano === 2026) {
            totalTributos = icmsissLiquido + pisCofinsLiquido;
        }

        return { icms_iss: icmsissLiquido, pis_cofins: pisCofinsLiquido, ibs: ibsLiquido, cbs: cbsLiquido, total: totalTributos };
    }

    function simular() {

        const receitaValor = +document.getElementById("receita").value;
        const custosValor = +document.getElementById("custos").value;
        const despesasValor = +document.getElementById("despesas").value;
        const tipo = document.getElementById("tipo").value;

        const tabela = document.getElementById("resultado");
        tabela.innerHTML = "";

        for (let ano = 2025; ano <= 2033; ano++) {

            const cbsAno = document.getElementById(`cbs_${ano}`)?.value || 0;
            const ibsAno = document.getElementById(`ibs_${ano}`)?.value || 0;

            const t = calcularTributos(
                ano,
                receitaValor,
                custosValor,
                despesasValor,
                tipo,
                +cbsAno,
                +ibsAno
            );

            const fco = receitaValor - custosValor - despesasValor - t.total;

            tabela.innerHTML += `
            <tr>
                <td>${ano}</td>
                <td>R$ ${t.icms_iss.toFixed(2)}</td>
                <td>R$ ${t.pis_cofins.toFixed(2)}</td>
                <td>R$ ${t.ibs.toFixed(2)}</td>
                <td>R$ ${t.cbs.toFixed(2)}</td>
                <td>R$ ${t.total.toFixed(2)}</td>
                <td>R$ ${fco.toFixed(2)}</td>
            </tr>
        `;
        }
    }

function testeConsistenciaInterna() {

    console.log("=== TESTE DE CONSISTÊNCIA INTERNA ===");

    const receita = 100000;
    const custos = 60000;
    const despesas = 10000;
    const tipo = "vendas";

    const ano = 2028;

    const aliquotaBaixa = calcularTributos(ano, receita, custos, despesas, tipo, 0.08, 0.18);
    const aliquotaAlta = calcularTributos(ano, receita, custos, despesas, tipo, 0.12, 0.28);

    const fcoBaixo = receita - custos - despesas - aliquotaBaixa.total;
    const fcoAlto = receita - custos - despesas - aliquotaAlta.total;

    console.log("FCO com tributo menor:", fcoBaixo);
    console.log("FCO com tributo maior:", fcoAlto);

    if (fcoAlto >= fcoBaixo) {
        console.error("Inconsistência detectada: aumento de tributo não reduziu o FCO.");
    } else {
        console.log("Modelo consistente: aumento de tributos reduz o FCO.");
    }

}


function analiseSensibilidade() {

    console.log("=== ANÁLISE DE SENSIBILIDADE ===");

    const receita = 100000;
    const custos = 60000;
    const despesas = 10000;
    const tipo = "vendas";
    const ano = 2033;

    for (let ibs = 0.15; ibs <= 0.30; ibs += 0.03) {

        const cbs = 0.10;

        const t = calcularTributos(
            ano,
            receita,
            custos,
            despesas,
            tipo,
            cbs,
            ibs
        );

        const fco = receita - custos - despesas - t.total;

        console.log(
            "IBS:", ibs.toFixed(2),
            "| CBS:", cbs.toFixed(2),
            "| Tributos:", t.total.toFixed(2),
            "| FCO:", fco.toFixed(2)
        );
    }

}

function executarValidacaoModelo() {

    console.log("=================================");
    console.log("VALIDAÇÃO DO MODELO TRIBUTÁRIO");
    console.log("=================================\n");

    testeConsistenciaInterna();

    analiseSensibilidade();
}


executarValidacaoModelo();