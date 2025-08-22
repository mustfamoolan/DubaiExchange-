import{u as _,r as b,j as e,L as D}from"./app-UvyA2JTE.js";import{A as k}from"./AdminLayout-BI_4b0I9.js";/* empty css            */function z({customer:n,transactions:m}){const{flash:x}=_().props,[c,y]=b.useState(""),[i,u]=b.useState(""),[h,f]=b.useState("all"),[g,j]=b.useState("all"),v=m.filter(r=>{const a=new Date(r.transaction_date),t=c?new Date(c):null,o=i?new Date(i):null,d=(!t||a>=t)&&(!o||a<=o),l=h==="all"||r.transaction_type===h,w=g==="all"||r.currency_type===g;return d&&l&&w}),p=(()=>{const r=[...m].sort((d,l)=>new Date(d.transaction_date)-new Date(l.transaction_date));let a=n.iqd_opening_balance||0,t=n.usd_opening_balance||0;const o=new Map;return r.forEach(d=>{const l=parseFloat(d.amount)||0;d.currency_type==="iqd"?d.transaction_type==="received"?a+=l:d.transaction_type==="delivered"&&(a-=l):d.currency_type==="usd"&&(d.transaction_type==="received"?t+=l:d.transaction_type==="delivered"&&(t-=l)),o.set(d.id,{runningBalanceIQD:a,runningBalanceUSD:t})}),v.map(d=>{const l=o.get(d.id)||{runningBalanceIQD:n.iqd_opening_balance||0,runningBalanceUSD:n.usd_opening_balance||0};return{...d,runningBalanceIQD:l.runningBalanceIQD,runningBalanceUSD:l.runningBalanceUSD}})})(),s=r=>{const a=Math.floor(r||0);return new Intl.NumberFormat("en-US").format(a)},N=()=>{const r=window.open("","_blank","width=800,height=600"),a=`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>كشف حساب العميل - ${n.name}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Arial', sans-serif;
                    }

                    body {
                        font-size: 12px;
                        line-height: 1.4;
                        color: #000;
                        background: white;
                        direction: rtl;
                    }

                    .container {
                        width: 100%;
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 10mm;
                    }

                    .header {
                        border: 2px solid #000;
                        margin-bottom: 10px;
                    }

                    .header-row {
                        display: grid;
                        grid-template-columns: 1fr auto 1fr auto 2fr auto;
                        border-bottom: 1px solid #000;
                    }

                    .header-cell {
                        padding: 8px;
                        text-align: center;
                        border-left: 1px solid #000;
                        font-weight: normal;
                    }

                    .header-cell:last-child {
                        border-left: none;
                    }

                    .header-cell.highlight {
                        background-color: #f5f5f5;
                        font-weight: bold;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 2px solid #000;
                        font-size: 11px;
                    }

                    th, td {
                        border: 1px solid #000;
                        padding: 4px 2px;
                        text-align: center;
                        vertical-align: middle;
                    }

                    th {
                        background-color: #f5f5f5;
                        font-weight: bold;
                        font-size: 12px;
                    }

                    .opening-balance {
                        background-color: #e3f2fd;
                        font-weight: bold;
                    }

                    .even-row {
                        background-color: #f9f9f9;
                    }

                    @page {
                        size: A4;
                        margin: 15mm;
                    }

                    @media print {
                        .container {
                            max-width: none;
                            margin: 0;
                            padding: 0;
                        }

                        body {
                            font-size: 10px;
                        }

                        table {
                            font-size: 9px;
                        }

                        th {
                            font-size: 10px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- ترويسة الكشف -->
                    <div class="header">
                        <div class="header-row">
                            <div class="header-cell highlight">الاسم</div>
                            <div class="header-cell">${n.name}</div>
                            <div class="header-cell">للتاريخ من</div>
                            <div class="header-cell highlight">${c||"2025-01-01"}</div>
                            <div class="header-cell">إلى</div>
                            <div class="header-cell highlight">${i||new Date().toISOString().split("T")[0]}</div>
                        </div>
                    </div>

                    <!-- جدول البيانات -->
                    <table>
                        <thead>
                            <tr>
                                <th>العملة</th>
                                <th>الرصيد</th>
                                <th>الصادر</th>
                                <th>الوارد</th>
                                <th>نوع الحركة</th>
                                <th>الملاحظات</th>
                                <th>رقم القائمة</th>
                                <th>ت الحركة</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- الرصيد الافتتاحي -->
                            <tr class="opening-balance">
                                <td>دينار</td>
                                <td>${s(n.iqd_opening_balance||0)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>رصيد افتتاحي</td>
                                <td>الرصيد الافتتاحي بالدينار العراقي</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                            <tr class="opening-balance">
                                <td>دولار</td>
                                <td>${s(n.usd_opening_balance||0)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>رصيد افتتاحي</td>
                                <td>الرصيد الافتتاحي بالدولار الأمريكي</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>

                            <!-- المعاملات -->
                            ${p.map((t,o)=>`
                                <tr class="${o%2===0?"even-row":""}">
                                    <td>${t.currency_type==="iqd"?"دينار":"دولار"}</td>
                                    <td>${t.currency_type==="iqd"?s(t.runningBalanceIQD):s(t.runningBalanceUSD)}</td>
                                    <td>${t.transaction_type==="delivered"?s(t.amount):"0"}</td>
                                    <td>${t.transaction_type==="received"?s(t.amount):"0"}</td>
                                    <td>${t.transaction_type==="received"?"قبض":"صرف"}</td>
                                    <td>${t.description||"-"}</td>
                                    <td>${t.transaction_code}</td>
                                    <td>${o+1}</td>
                                </tr>
                            `).join("")}

                            ${p.length===0?`
                                <tr>
                                    <td colspan="8" style="padding: 20px; color: #666;">
                                        لا توجد معاملات في الفترة المحددة
                                    </td>
                                </tr>
                            `:""}
                        </tbody>
                    </table>
                </div>

                <script>
                    // طباعة تلقائية عند فتح النافذة
                    window.onload = function() {
                        window.print();
                        // إغلاق النافذة بعد الطباعة
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                <\/script>
            </body>
            </html>
        `;r.document.write(a),r.document.close()};return e.jsx(k,{title:`كشف حساب العميل: ${n.name}`,children:e.jsxs("div",{className:"space-y-6",children:[x.success&&e.jsx("div",{className:"mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded",children:x.success}),x.error&&e.jsx("div",{className:"mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded",children:x.error}),e.jsx("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 p-4 no-print",children:e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-4",children:[e.jsxs(D,{href:"/admin/customers",className:"bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2",children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M10 19l-7-7m0 0l7-7m-7 7h18"})}),"العودة للعملاء"]}),e.jsxs("div",{className:"flex flex-wrap gap-3",children:[e.jsx("input",{type:"date",value:c,onChange:r=>y(r.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",placeholder:"من تاريخ"}),e.jsx("input",{type:"date",value:i,onChange:r=>u(r.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",placeholder:"إلى تاريخ"}),e.jsxs("select",{value:h,onChange:r=>f(r.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"all",children:"جميع الحركات"}),e.jsx("option",{value:"received",children:"قبض"}),e.jsx("option",{value:"delivered",children:"صرف"})]}),e.jsxs("select",{value:g,onChange:r=>j(r.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"all",children:"جميع العملات"}),e.jsx("option",{value:"iqd",children:"دينار"}),e.jsx("option",{value:"usd",children:"دولار"})]}),e.jsxs("button",{onClick:N,className:"bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2",children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})}),"طباعة"]})]})]})}),e.jsxs("div",{className:"bg-white border border-gray-400",children:[e.jsx("div",{className:"border-b border-gray-400",children:e.jsxs("div",{className:"grid grid-cols-6 border-b border-gray-400",children:[e.jsx("div",{className:"p-2 text-center text-sm font-medium bg-gray-100",children:"الاسم"}),e.jsx("div",{className:"border-r border-gray-400 p-2 text-center text-sm font-medium",children:n.name}),e.jsx("div",{className:"border-r border-gray-400 p-2 text-center text-sm",children:"للتاريخ من"}),e.jsx("div",{className:"border-r border-gray-400 p-2 text-center text-sm font-medium bg-gray-100",children:c||"2025-01-01"}),e.jsx("div",{className:"border-r border-gray-400 p-2 text-center text-sm",children:"إلى"}),e.jsx("div",{className:"border-r border-gray-400 p-2 text-center text-sm font-medium bg-gray-100",children:i||new Date().toISOString().split("T")[0]})]})}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"min-w-full border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-gray-100",children:[e.jsx("th",{className:"border border-gray-400 px-2 py-2 text-center text-sm font-bold",children:"العملة"}),e.jsx("th",{className:"border border-gray-400 px-2 py-2 text-center text-sm font-bold",children:"الرصيد"}),e.jsx("th",{className:"border border-gray-400 px-2 py-2 text-center text-sm font-bold",children:"الصادر"}),e.jsx("th",{className:"border border-gray-400 px-2 py-2 text-center text-sm font-bold",children:"الوارد"}),e.jsx("th",{className:"border border-gray-400 px-2 py-2 text-center text-sm font-bold",children:"نوع الحركة"}),e.jsx("th",{className:"border border-gray-400 px-2 py-2 text-center text-sm font-bold",children:"الملاحظات"}),e.jsx("th",{className:"border border-gray-400 px-2 py-2 text-center text-sm font-bold",children:"رقم القائمة"}),e.jsx("th",{className:"border border-gray-400 px-2 py-2 text-center text-sm font-bold",children:"ت الحركة"})]})}),e.jsxs("tbody",{className:"bg-white",children:[e.jsxs("tr",{className:"bg-blue-50 border-b-2 border-blue-300",children:[e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs font-bold",children:"دينار"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs font-bold",children:s(n.iqd_opening_balance||0)}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"-"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"-"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs font-bold",children:"رصيد افتتاحي"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"الرصيد الافتتاحي بالدينار العراقي"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"-"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"-"})]}),e.jsxs("tr",{className:"bg-blue-50 border-b-2 border-blue-300",children:[e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs font-bold",children:"دولار"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs font-bold",children:s(n.usd_opening_balance||0)}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"-"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"-"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs font-bold",children:"رصيد افتتاحي"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"الرصيد الافتتاحي بالدولار الأمريكي"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"-"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:"-"})]}),p.length>0?p.map((r,a)=>e.jsxs("tr",{className:a%2===0?"bg-white":"bg-gray-50",children:[e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:r.currency_type==="iqd"?"دينار":"دولار"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:r.currency_type==="iqd"?s(r.runningBalanceIQD):s(r.runningBalanceUSD)}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:r.transaction_type==="delivered"?s(r.amount):"0"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:r.transaction_type==="received"?s(r.amount):"0"}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:r.transaction_type==="received"?"قبض":"صرف"}),e.jsxs("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:[r.description||"-",r.notes&&e.jsx("div",{className:"text-xs text-gray-500 mt-1",children:r.notes})]}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:r.transaction_code}),e.jsx("td",{className:"border border-gray-400 px-2 py-1 text-center text-xs",children:a+1})]},r.id)):e.jsx("tr",{children:e.jsx("td",{colSpan:"8",className:"border border-gray-400 px-6 py-8 text-center text-gray-500",children:e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx("svg",{className:"w-12 h-12 text-gray-400 mb-2",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})}),e.jsx("p",{className:"font-medium",children:"لا توجد معاملات في الفترة المحددة"}),e.jsx("p",{className:"text-sm",children:"جرب تغيير فلاتر البحث أو الفترة الزمنية"})]})})})]})]})})]})]})})}export{z as default};
