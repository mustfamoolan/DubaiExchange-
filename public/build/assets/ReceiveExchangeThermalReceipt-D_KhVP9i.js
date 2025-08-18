import{r as h,j as e}from"./app-ClDSC9q7.js";function b(){const[s,o]=h.useState(!1),[d,r]=h.useState(null),[x,c]=h.useState(!1),a=(i,n="receive")=>{const m={reference_number:i.documentNumber||i.reference_number,employee_name:i.receiverName||i.employee_name||"الموظف الحالي",person_name:i.receivedFrom||i.paidTo||i.person_name,currency:i.currency,amount:i.amount,exchange_rate:i.exchange_rate,amount_in_iqd:i.amount_in_iqd||parseFloat(i.amount)*parseFloat(i.exchange_rate||1),beneficiary:i.beneficiary||"الصندوق النقدي",description:i.description,notes:i.notes,receipt_type:n,created_at:new Date().toISOString()};return r(m),o(!0),m};return{showReceipt:s,receiptData:d,isCreatingReceipt:x,createReceiveExchangeReceipt:a,createReceiptAndSave:async(i,n,m="receive")=>{c(!0);try{const l=await i();if(l&&l.success!==!1){const u={documentNumber:n.reference_number||n.documentNumber,receiverName:n.employee_name||"الموظف الحالي",receivedFrom:n.person_name||n.receivedFrom||n.paidTo,currency:n.currency,amount:n.amount,exchange_rate:n.exchange_rate,beneficiary:n.beneficiary||"الصندوق النقدي",description:n.description,notes:n.notes};return a(u,m),{success:!0,data:l}}else throw new Error(l.error||"فشل في حفظ المعاملة")}catch(l){return console.error("خطأ في createReceiptAndSave:",l),alert(l.message||"حدث خطأ في العملية"),{success:!1,error:l.message}}finally{c(!1)}},printReceipt:()=>{console.log("تم طباعة فاتورة سند القبض/الصرف")},closeReceipt:()=>{o(!1),r(null)}}}function v({receiptData:s,onClose:o,onPrint:d,receiptType:r="receive"}){const x=()=>{const t=window.open("","_blank"),g=document.getElementById("thermal-receipt-content").innerHTML;t.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>طباعة ${r==="receive"?"سند القبض":"سند الصرف"}</title>
                <style>
                    @page {
                        size: 80mm 210mm;
                        margin: 0;
                    }

                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        font-family: 'Arial', sans-serif;
                        font-size: 9px;
                        line-height: 1.1;
                        color: #000;
                        background: #fff;
                        direction: rtl;
                        text-align: right;
                        width: 80mm;
                        padding: 3mm;
                    }

                    .receipt {
                        width: 100%;
                        max-width: 74mm;
                        margin: 0 auto;
                    }

                    .header {
                        text-align: center;
                        border-bottom: 1px solid #000;
                        padding-bottom: 3mm;
                        margin-bottom: 3mm;
                    }

                    .company-name {
                        font-weight: bold;
                        font-size: 11px;
                        margin-bottom: 1mm;
                    }

                    .receipt-title {
                        font-weight: bold;
                        font-size: 10px;
                        margin-bottom: 1mm;
                    }

                    .receipt-number {
                        font-size: 8px;
                        margin-bottom: 1mm;
                    }

                    .date-time {
                        font-size: 7px;
                    }

                    .content {
                        margin: 3mm 0;
                    }

                    .field-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 2mm;
                        border-bottom: 1px dotted #ccc;
                        padding-bottom: 1mm;
                    }

                    .field-label {
                        font-weight: bold;
                        font-size: 8px;
                        min-width: 18mm;
                        flex-shrink: 0;
                    }

                    .field-value {
                        font-size: 8px;
                        text-align: left;
                        flex-grow: 1;
                        word-wrap: break-word;
                    }

                    .amount-section {
                        border: 1px solid #000;
                        padding: 2mm;
                        margin: 2mm 0;
                        text-align: center;
                    }

                    .amount-large {
                        font-size: 12px;
                        font-weight: bold;
                        margin: 1mm 0;
                    }

                    .description-section {
                        border: 1px solid #ccc;
                        padding: 1.5mm;
                        margin: 2mm 0;
                        min-height: 6mm;
                    }

                    .description-title {
                        font-weight: bold;
                        font-size: 8px;
                        margin-bottom: 1mm;
                    }

                    .description-text {
                        font-size: 7px;
                        line-height: 1.2;
                    }

                    .signature-section {
                        margin-top: 4mm;
                        border-top: 1px solid #000;
                        padding-top: 2mm;
                    }

                    .signature-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 2mm;
                    }

                    .signature-box {
                        text-align: center;
                        width: 20mm;
                    }

                    .signature-line {
                        border-bottom: 1px solid #000;
                        height: 4mm;
                        margin-bottom: 1mm;
                    }

                    .signature-label {
                        font-size: 6px;
                        font-weight: bold;
                    }

                    .footer {
                        text-align: center;
                        margin-top: 4mm;
                        padding-top: 2mm;
                        border-top: 1px dotted #ccc;
                        font-size: 6px;
                    }

                    .notes-section {
                        margin-top: 2mm;
                        padding: 1.5mm;
                        border: 1px dashed #ccc;
                    }

                    .notes-title {
                        font-weight: bold;
                        font-size: 7px;
                        margin-bottom: 1mm;
                    }

                    .notes-text {
                        font-size: 6px;
                        line-height: 1.2;
                    }

                    @media print {
                        body {
                            print-color-adjust: exact;
                        }

                        .receipt {
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                ${g}
            </body>
            </html>
        `),t.document.close(),t.focus(),setTimeout(()=>{t.print(),t.close()},250),d&&d()},c=()=>r==="receive"?"سند قبض":"سند صرف",a=()=>r==="receive"?"المبلغ المستلم":"المبلغ المصروف",p=()=>r==="receive"?"استلمت من السيد":"صرف للسيد";return e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4",children:e.jsxs("div",{className:"bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"p-4 border-b border-gray-200 flex justify-between items-center",children:[e.jsxs("h2",{className:"text-lg font-bold text-gray-900",children:["معاينة ",c()]}),e.jsx("button",{onClick:o,className:"text-gray-500 hover:text-gray-700 text-2xl",children:"×"})]}),e.jsx("div",{className:"p-4",children:e.jsx("div",{id:"thermal-receipt-content",children:e.jsxs("div",{className:"receipt",children:[e.jsxs("div",{className:"header",children:[e.jsx("div",{className:"company-name",children:"مكتب دبي للصرافة"}),e.jsx("div",{className:"receipt-title",children:c()}),e.jsxs("div",{className:"receipt-number",children:["رقم: ",s.reference_number]}),e.jsx("div",{className:"date-time",children:new Date().toLocaleString("ar-EG")})]}),e.jsxs("div",{className:"content",children:[e.jsxs("div",{className:"field-row",children:[e.jsx("span",{className:"field-label",children:"رقم المستند:"}),e.jsx("span",{className:"field-value",children:s.reference_number})]}),e.jsxs("div",{className:"field-row",children:[e.jsx("span",{className:"field-label",children:"التاريخ:"}),e.jsx("span",{className:"field-value",children:new Date().toLocaleDateString("ar-EG")})]}),e.jsxs("div",{className:"field-row",children:[e.jsx("span",{className:"field-label",children:"الوقت:"}),e.jsx("span",{className:"field-value",children:new Date().toLocaleTimeString("ar-EG")})]}),e.jsxs("div",{className:"field-row",children:[e.jsx("span",{className:"field-label",children:"الموظف:"}),e.jsx("span",{className:"field-value",children:s.employee_name||"الموظف الحالي"})]}),e.jsxs("div",{className:"field-row",children:[e.jsxs("span",{className:"field-label",children:[p(),":"]}),e.jsx("span",{className:"field-value",children:s.person_name})]}),e.jsxs("div",{className:"field-row",children:[e.jsx("span",{className:"field-label",children:"العملة:"}),e.jsx("span",{className:"field-value",children:s.currency})]}),e.jsxs("div",{className:"field-row",children:[e.jsx("span",{className:"field-label",children:"المبلغ:"}),e.jsx("span",{className:"field-value",children:parseFloat(s.amount).toLocaleString()})]}),s.currency!=="دينار عراقي"&&s.exchange_rate&&e.jsxs("div",{className:"field-row",children:[e.jsx("span",{className:"field-label",children:"سعر الصرف:"}),e.jsx("span",{className:"field-value",children:parseFloat(s.exchange_rate).toLocaleString()})]}),e.jsxs("div",{className:"amount-section",children:[e.jsx("div",{className:"field-label",children:a()}),e.jsxs("div",{className:"amount-large",children:[s.amount_in_iqd?Math.floor(s.amount_in_iqd).toLocaleString():Math.floor(parseFloat(s.amount)*parseFloat(s.exchange_rate||1)).toLocaleString()," د.ع"]})]}),e.jsxs("div",{className:"field-row",children:[e.jsx("span",{className:"field-label",children:"المستفيد:"}),e.jsx("span",{className:"field-value",children:s.beneficiary||"الصندوق النقدي"})]}),s.description&&e.jsxs("div",{className:"description-section",children:[e.jsx("div",{className:"description-title",children:"وذلك عن:"}),e.jsx("div",{className:"description-text",children:s.description})]}),s.notes&&e.jsxs("div",{className:"notes-section",children:[e.jsx("div",{className:"notes-title",children:"ملاحظات:"}),e.jsx("div",{className:"notes-text",children:s.notes})]}),e.jsx("div",{className:"signature-section",children:e.jsxs("div",{className:"signature-row",children:[e.jsxs("div",{className:"signature-box",children:[e.jsx("div",{className:"signature-line"}),e.jsx("div",{className:"signature-label",children:"توقيع المستلم"})]}),e.jsxs("div",{className:"signature-box",children:[e.jsx("div",{className:"signature-line"}),e.jsx("div",{className:"signature-label",children:"توقيع المسؤول"})]})]})}),e.jsxs("div",{className:"footer",children:[e.jsx("div",{children:"شكراً لثقتكم بنا"}),e.jsx("div",{children:"مكتب دبي للصرافة"})]})]})]})})}),e.jsxs("div",{className:"p-4 border-t border-gray-200 flex gap-2",children:[e.jsx("button",{onClick:x,className:"flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200",children:"🖨️ طباعة"}),e.jsx("button",{onClick:o,className:"flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200",children:"إغلاق"})]})]})})}export{v as R,b as u};
