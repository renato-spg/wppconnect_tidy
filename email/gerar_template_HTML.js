import dayjs from "dayjs";

export function gerarTemplateHTML(dados) {
  const dataHoje = dayjs().format("DD/MM/YYYY");

  const table = (title, rows, extraHeaders = [], extraColsFn = null) => `
    <h2 style="color: #333">${title}</h2>
    <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Loja</th>
          ${extraHeaders
            .map(
              (h) =>
                `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${h}</th>`
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${r.loja}</td>
            ${extraColsFn ? extraColsFn(r) : ""}
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  console.log("dados antes do HTML:", dados);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #4CAF50;">📊 Relatório Diário - ${dataHoje}</h1>
      <p><strong>Total geral de clientes:</strong> ${dados.totalGeral}</p>
      
      ${table(
        "Clientes por Loja",
        dados.clientesPorLoja,
        ["Total"],
        (r) => `<td style="border: 1px solid #ddd; padding: 8px;">
                ${
                  isNaN(Number(r.total)) || r.total === 0
                    ? "0"
                    : Math.round(Number(r.total))
                }
              </td>`
      )}

      <p><strong>Total cadastrados hoje:</strong> ${dados.cadastradosHoje}</p>

      ${table(
        "Clientes cadastrados hoje por loja (comparado ao maior dia anterior)",
        dados.clientesHojePorLoja,
        ["Total", "Meta", "Meta batida?"],
        (r) => `
          <td style="border: 1px solid #ddd; padding: 8px;">
            ${
              isNaN(Number(r.total)) || r.total === 0
                ? "0"
                : Math.round(Number(r.total))
            }
          </td>
          <td style="border: 1px solid #ddd; padding: 8px;">${
            Number(r.meta) || "–"
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; color: ${
            r.bateuMeta ? "green" : "red"
          };">
            ${r.bateuMeta ? "✅ Sim" : "❌ Não"}
          </td>
        `
      )}

      ${table(
        "Maior número de cadastros anteriores por loja",
        dados.lojasComDesempenho,
        ["Meta"],
        (r) => `
          <td style="border: 1px solid #ddd; padding: 8px;">${
            Number(r.meta) || "–"
          }</td>
        `
      )}
    </div>
  `;
}
