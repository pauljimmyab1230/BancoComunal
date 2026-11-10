function e(e,t=`PEN`,n=`es-PE`){return new Intl.NumberFormat(n,{style:`currency`,currency:t}).format(e)}function t(t){return!t||Object.keys(t).length===0?e(0):Object.entries(t).map(([t,n])=>e(n,t)).join(` · `)}function n(e,t,n){let r=[t,...n].map(e=>e.map(e=>`"${String(e??``).replace(/"/g,`""`)}"`).join(`,`)).join(`
`),i=new Blob([`﻿`+r],{type:`text/csv;charset=utf-8;`}),a=URL.createObjectURL(i),o=document.createElement(`a`);o.href=a,o.download=e,o.click(),URL.revokeObjectURL(a)}function r(e,t,n){let r=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`),i=`
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Sheet1</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px 12px; text-align: left; }
        th { background-color: #2563EB; color: white; font-weight: bold; }
        td { mso-number-format: \\@; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${t.map(e=>`<th>${r(e)}</th>`).join(``)}</tr>
        </thead>
        <tbody>
          ${n.map(e=>`<tr>${e.map(e=>`<td>${r(String(e??``))}</td>`).join(``)}</tr>`).join(``)}
        </tbody>
      </table>
    </body>
    </html>
  `,a=new Blob([`﻿`+i],{type:`application/vnd.ms-excel;charset=utf-8;`}),o=URL.createObjectURL(a),s=document.createElement(`a`);s.href=o,s.download=e.replace(/\.xlsx?$/i,`.xls`),s.click(),URL.revokeObjectURL(o)}export{t as i,r as n,e as r,n as t};