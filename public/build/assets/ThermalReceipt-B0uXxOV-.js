import{r as p,e as y,R as v,j as s}from"./app-B184Dx-J.js";const j=()=>{const[e,i]=p.useState(!1),[l,d]=p.useState(null),[u,a]=p.useState(!1),x=async(t,o)=>{a(!0),console.log("Creating thermal receipt:",{transactionData:t,serviceType:o,windowWidth:window.innerWidth,isMobile:window.innerWidth<=768});try{const n=await fetch("/employee/thermal-receipt/create",{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content")},body:JSON.stringify({transaction_type:t.transaction_type,service_type:o,reference_number:t.reference_number,amount:t.amount,commission:t.commission,notes:t.notes,customer_phone:t.customer_phone||null})});if(n.ok){const r=await n.json();return d(r.receipt_data),i(!0),console.log("Receipt created successfully:",{receiptData:r.receipt_data,showReceipt:!0,windowWidth:window.innerWidth}),{success:!0,receipt:r.receipt}}else{const r=await n.json();throw new Error(r.message||"فشل في إنشاء الفاتورة")}}catch(n){return console.error("خطأ في إنشاء الفاتورة:",n),alert("حدث خطأ في إنشاء الفاتورة: "+n.message),{success:!1,error:n.message}}finally{a(!1)}};return{showReceipt:e,receiptData:l,isCreatingReceipt:u,createReceipt:x,createSellReceipt:async t=>{a(!0);try{const o=await fetch("/employee/thermal-receipt/create-sell",{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content")},body:JSON.stringify({reference_number:t.reference_number,dollar_amount:t.dollar_amount,exchange_rate:t.exchange_rate,iqd_amount:t.iqd_amount,commission:t.commission,total_amount:t.total_amount,notes:t.notes,customer_phone:t.customer_phone||null})});if(o.ok){const n=await o.json();return d(n.receipt_data),i(!0),{success:!0,receipt:n.receipt}}else{const n=await o.json();throw new Error(n.message||"فشل في إنشاء فاتورة البيع")}}catch(o){return console.error("Error creating sell receipt:",o),{success:!1,error:o.message}}finally{a(!1)}},createBuyReceipt:async t=>{a(!0);try{const o=await fetch("/employee/thermal-receipt/create-buy",{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content")},body:JSON.stringify({reference_number:t.reference_number,dollar_amount:t.dollar_amount,exchange_rate:t.exchange_rate,iqd_amount:t.iqd_amount,commission:t.commission,total_amount:t.total_amount,notes:t.notes,customer_phone:t.customer_phone||null})});if(o.ok){const n=await o.json();return d(n.receipt_data),i(!0),{success:!0,receipt:n.receipt}}else{const n=await o.json();throw new Error(n.message||"فشل في إنشاء فاتورة الشراء")}}catch(o){return console.error("Error creating buy receipt:",o),{success:!1,error:o.message}}finally{a(!1)}},printReceipt:async()=>{if(!(!l||!l.receipt_id))try{const t=await fetch(`/employee/thermal-receipt/print/${l.receipt_id}`,{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content")}});if(t.ok)return{success:!0};{const o=await t.json();throw new Error(o.message||"فشل في تسجيل الطباعة")}}catch(t){return console.error("خطأ في تسجيل الطباعة:",t),{success:!1,error:t.message}}},closeReceipt:()=>{i(!1),d(null)},createReceiptAndSave:async(t,o,n)=>{try{const r=await t();if(r&&r.success!==!1){const c=await x({...o,transaction_type:o.activeTab||o.transaction_type},n);return{success:!0,transaction:r,receipt:c}}else throw new Error(r?.error||"فشل في حفظ المعاملة")}catch(r){return console.error("خطأ في حفظ المعاملة وإنشاء الفاتورة:",r),alert("حدث خطأ: "+r.message),{success:!1,error:r.message}}}}};var w=y();const N=({receiptData:e,onClose:i,onPrint:l})=>{const d=p.useRef(null),[u,a]=p.useState(!1),[x,h]=p.useState(!1);console.log("ThermalReceipt receiptData:",e);const g=n=>{console.log("Looking for service image for:",n);const c={rafidain:"/images/services/rafidain-bank.png",rashid:"/images/services/rashid-bank.png",zain_cash:"/images/services/zain-cash.png",super_key:"/images/services/super-key.png",buy_usd:"/images/services/buy.png",sell_usd:"/images/services/sell.png",receive:"/images/services/receive.png",exchange:"/images/services/exchange.png"}[n]||"/images/services/default.png";return console.log("Selected image path:",c),c},m=navigator.share&&window.innerWidth<=768;v.useEffect(()=>{document.body.style.overflow="hidden";const n=r=>{r.key==="Escape"&&i()};return document.addEventListener("keydown",n),console.log("ThermalReceipt opened:",{windowWidth:window.innerWidth,windowHeight:window.innerHeight,canShare:m,receiptData:e}),()=>{document.body.style.overflow="auto",document.removeEventListener("keydown",n)}},[m,e,i]);const f=async()=>{a(!0);try{if(window.innerWidth<=768){const n=window.open("","_blank"),r=t();n.document.write(r),n.document.close(),n.focus();try{n.print()}catch(c){console.error("خطأ في الطباعة:",c),alert('للطباعة على الموبايل، يرجى استخدام ميزة "طباعة" من متصفحك')}setTimeout(()=>{try{n.close()}catch{console.log("النافذة مغلقة بالفعل")}},1e3)}else{const n=window.open("","_blank"),r=t();n.document.write(r),n.document.close(),n.focus(),n.print(),n.addEventListener("afterprint",()=>{n.close()})}l&&await l()}catch(n){console.error("خطأ في الطباعة:",n),alert("حدث خطأ أثناء الطباعة. يرجى المحاولة مرة أخرى.")}finally{a(!1)}},b=async()=>{h(!0);try{if(navigator.share){const n=e.service_type==="buy_usd"||e.service_type==="sell_usd"?`فاتورة ${e.transaction_type} ${e.service_name}
رقم الفاتورة: ${e.receipt_number}
مبلغ الدولار: $${e.dollar_amount}
سعر الصرف: ${e.exchange_rate} د.ع
المبلغ بالدينار: ${e.iqd_amount} د.ع
العمولة: ${e.commission} د.ع
المجموع: ${e.total_amount} د.ع
التاريخ: ${e.created_at}
الموظف: ${e.employee_name}`:`فاتورة ${e.transaction_type==="charge"?"شحن":"دفع"} ${e.service_name}
رقم الفاتورة: ${e.receipt_number}
المبلغ: ${e.amount} د.ع
العمولة: ${e.commission} د.ع
المجموع: ${e.total_amount} د.ع
التاريخ: ${e.created_at}
الموظف: ${e.employee_name}`;await navigator.share({title:`فاتورة ${e.service_name} - ${e.receipt_number}`,text:n})}}catch(n){console.error("خطأ في المشاركة:",n)}finally{h(!1)}},t=()=>`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>فاتورة حرارية - ${e.receipt_number}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Arial', sans-serif;
                    width: 80mm;
                    margin: 0 auto;
                    padding: 5mm;
                    background: white;
                    color: #000;
                    font-size: 12px;
                    line-height: 1.4;
                }

                .receipt-container {
                    width: 100%;
                    text-align: center;
                }

                .header {
                    border-bottom: 2px dashed #000;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                }

                .company-name {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .company-info {
                    font-size: 10px;
                    color: #555;
                    margin-bottom: 5px;
                }

                .receipt-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin: 10px 0;
                    padding: 5px;
                    background: #f0f0f0;
                    border-radius: 3px;
                }

                .receipt-info {
                    text-align: right;
                    margin: 10px 0;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                    padding: 2px 0;
                }

                .info-label {
                    font-weight: bold;
                    min-width: 60px;
                }

                .info-value {
                    flex: 1;
                    text-align: left;
                }

                .amount-section {
                    border-top: 1px solid #000;
                    border-bottom: 1px solid #000;
                    padding: 8px 0;
                    margin: 10px 0;
                }

                .amount-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                }

                .total-amount {
                    font-size: 14px;
                    font-weight: bold;
                    border-top: 1px dashed #000;
                    padding-top: 5px;
                    margin-top: 5px;
                }

                .notes {
                    text-align: right;
                    margin: 10px 0;
                    font-size: 10px;
                    color: #666;
                }

                .footer {
                    border-top: 2px dashed #000;
                    padding-top: 8px;
                    margin-top: 15px;
                    text-align: center;
                    font-size: 10px;
                }

                @media print {
                    @page {
                        size: 80mm 210mm;
                        margin: 0;
                    }

                    body {
                        width: 80mm;
                        max-width: 80mm;
                        margin: 0;
                        padding: 3mm;
                        font-size: 10px;
                        line-height: 1.2;
                    }

                    .receipt-container {
                        page-break-inside: avoid;
                        width: 100%;
                        max-width: 74mm;
                    }

                    .company-name {
                        font-size: 14px;
                    }

                    .company-info {
                        font-size: 8px;
                    }

                    .receipt-title {
                        font-size: 12px;
                        margin: 8px 0;
                        padding: 3px;
                    }

                    .info-row {
                        margin: 2px 0;
                        padding: 1px 0;
                        font-size: 9px;
                    }

                    .amount-section {
                        padding: 6px 0;
                        margin: 8px 0;
                    }

                    .amount-row {
                        margin: 2px 0;
                        font-size: 10px;
                    }

                    .total-amount {
                        font-size: 12px;
                        padding-top: 3px;
                        margin-top: 3px;
                    }

                    .notes {
                        margin: 8px 0;
                        font-size: 8px;
                    }

                    .footer {
                        padding-top: 6px;
                        margin-top: 12px;
                        font-size: 8px;
                    }

                    /* إخفاء عناصر غير ضرورية للطباعة */
                    img {
                        max-width: 20mm;
                        max-height: 20mm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <!-- رأس الفاتورة -->
                <div class="header">
                    <img src="${g(e.service_type||e.service)}" alt="${e.service_name}" style="width: 40px; height: 40px; margin: 0 auto; display: block; margin-bottom: 5px;" />
                    <div class="company-name">${e.company_info?.name||"دبي العملية للصرافة"}</div>
                    <div class="company-info">هاتف: ${e.company_info?.phone||"07801234567"}</div>
                    <div class="company-info">${e.company_info?.address||"العراق - بغداد"}</div>
                </div>

                <!-- عنوان الفاتورة -->
                <div class="receipt-title">
                    فاتورة ${e.transaction_type} - ${e.service_name}
                </div>

                <!-- معلومات الفاتورة -->
                <div class="receipt-info">
                    <div class="info-row">
                        <span class="info-label">رقم الفاتورة:</span>
                        <span class="info-value">${e.receipt_number}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">رقم المرجع:</span>
                        <span class="info-value">${e.reference_number}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">التاريخ:</span>
                        <span class="info-value">${e.date}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">الوقت:</span>
                        <span class="info-value">${e.time}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">الموظف:</span>
                        <span class="info-value">${e.employee_name}</span>
                    </div>
                    ${e.customer_phone?`
                    <div class="info-row">
                        <span class="info-label">هاتف العميل:</span>
                        <span class="info-value">${e.customer_phone}</span>
                    </div>
                    `:""}
                </div>

                <!-- قسم المبالغ -->
                <div class="amount-section">
                    ${e.service_type==="buy_usd"||e.service_type==="sell_usd"?`
                    <div class="amount-row">
                        <span>مبلغ الدولار:</span>
                        <span>$${e.dollar_amount}</span>
                    </div>
                    <div class="amount-row">
                        <span>سعر الصرف:</span>
                        <span>${e.exchange_rate} د.ع</span>
                    </div>
                    <div class="amount-row">
                        <span>المبلغ بالدينار:</span>
                        <span>${e.iqd_amount} د.ع</span>
                    </div>
                    `:`
                    <div class="amount-row">
                        <span>المبلغ:</span>
                        <span>${e.amount} د.ع</span>
                    </div>
                    `}
                    <div class="amount-row">
                        <span>العمولة:</span>
                        <span>${e.commission} د.ع</span>
                    </div>
                    <div class="amount-row total-amount">
                        <span>المجموع:</span>
                        <span>${e.total_amount} د.ع</span>
                    </div>
                </div>

                <!-- الملاحظات -->
                ${e.notes?`
                <div class="notes">
                    ملاحظات: ${e.notes}
                </div>
                `:""}

                <!-- تذييل الفاتورة -->
                <div class="footer">
                    <div>${e.company_info?.footer_text||"شكراً لكم لتعاملكم معنا"}</div>
                    <div style="margin-top: 5px; font-size: 8px;">
                        تم الطباعة في: ${new Date().toLocaleString("ar-IQ")}
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;if(!e)return null;const o=s.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center",style:{zIndex:9999},onClick:n=>{n.target===n.currentTarget&&i()},children:s.jsxs("div",{className:"w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:mx-auto sm:max-h-[95vh] bg-white sm:rounded-xl shadow-2xl overflow-hidden flex flex-col",onClick:n=>n.stopPropagation(),children:[s.jsxs("div",{className:"bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 flex justify-between items-center flex-shrink-0",children:[s.jsxs("h2",{className:"text-base sm:text-lg md:text-xl font-bold text-white flex items-center",children:[s.jsx("span",{className:"text-lg sm:text-xl md:text-2xl ml-2",children:"🧾"}),"فاتورة حرارية"]}),s.jsx("button",{onClick:n=>{n.preventDefault(),n.stopPropagation(),i()},className:"text-white hover:text-gray-200 text-xl sm:text-2xl md:text-3xl font-bold transition-colors duration-200 p-2 touch-manipulation bg-red-500 hover:bg-red-600 rounded-full flex-shrink-0",style:{minWidth:"44px",minHeight:"44px"},"aria-label":"إغلاق النافذة",children:"×"})]}),s.jsx("div",{className:"flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50",children:s.jsxs("div",{ref:d,className:"thermal-receipt bg-white p-3 sm:p-4 text-center font-mono text-xs sm:text-sm border border-gray-200 rounded-lg mx-auto",style:{width:"100%",maxWidth:"80mm",minHeight:"210mm",margin:"0 auto",fontFamily:"monospace, Arial, sans-serif",lineHeight:"1.2",aspectRatio:"80/210"},children:[s.jsxs("div",{className:"text-center border-b-2 border-dashed border-gray-400 pb-2 mb-3",children:[s.jsx("img",{src:g(e.service_type||e.service),alt:e.service_name,className:"w-10 h-10 mx-auto mb-2",onError:n=>{console.log("Image failed to load, using fallback"),n.target.src="/images/services/default.png",n.target.onerror=()=>{n.target.style.display="none",n.target.nextSibling.style.display="block"}}}),s.jsx("div",{className:"text-2xl mb-2 hidden",children:"📄"}),s.jsx("div",{className:"font-bold text-sm",children:e.company_info?.name||"دبي العملية للصرافة"}),s.jsxs("div",{className:"text-xs text-gray-600",children:["هاتف: ",e.company_info?.phone||"07801234567"]}),s.jsx("div",{className:"text-xs text-gray-600",children:e.company_info?.address||"العراق - بغداد"})]}),s.jsxs("div",{className:"text-center font-bold text-sm bg-gray-100 p-2 rounded mb-3",children:["فاتورة ",e.transaction_type," - ",e.service_name]}),s.jsxs("div",{className:"space-y-1 text-xs",children:[s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{className:"font-bold",children:"رقم الفاتورة:"}),s.jsx("span",{children:e.receipt_number})]}),s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{className:"font-bold",children:"رقم المرجع:"}),s.jsx("span",{children:e.reference_number})]}),s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{className:"font-bold",children:"التاريخ:"}),s.jsx("span",{children:e.date})]}),s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{className:"font-bold",children:"الوقت:"}),s.jsx("span",{children:e.time})]}),s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{className:"font-bold",children:"الموظف:"}),s.jsx("span",{children:e.employee_name})]}),e.customer_phone&&s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{className:"font-bold",children:"هاتف العميل:"}),s.jsx("span",{children:e.customer_phone})]})]}),s.jsxs("div",{className:"border-t border-b border-gray-400 py-2 my-3 text-xs",children:[e.service_type==="buy_usd"||e.service_type==="sell_usd"?s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{children:"مبلغ الدولار:"}),s.jsxs("span",{children:["$",e.dollar_amount]})]}),s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{children:"سعر الصرف:"}),s.jsxs("span",{children:[e.exchange_rate," د.ع"]})]}),s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{children:"المبلغ بالدينار:"}),s.jsxs("span",{children:[e.iqd_amount," د.ع"]})]})]}):s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{children:"المبلغ:"}),s.jsxs("span",{children:[e.amount," د.ع"]})]}),s.jsxs("div",{className:"flex justify-between",children:[s.jsx("span",{children:"العمولة:"}),s.jsxs("span",{children:[e.commission," د.ع"]})]}),s.jsxs("div",{className:"flex justify-between font-bold border-t border-dashed border-gray-400 pt-1 mt-1",children:[s.jsx("span",{children:"المجموع:"}),s.jsxs("span",{children:[e.total_amount," د.ع"]})]})]}),e.notes&&s.jsxs("div",{className:"text-xs text-gray-600 mb-3",children:["ملاحظات: ",e.notes]}),s.jsxs("div",{className:"text-center border-t-2 border-dashed border-gray-400 pt-2 text-xs",children:[s.jsx("div",{children:e.company_info?.footer_text||"شكراً لكم لتعاملكم معنا"}),s.jsxs("div",{className:"text-xs text-gray-500 mt-1",children:["تم الطباعة في: ",new Date().toLocaleString("ar-IQ")]})]})]})}),s.jsx("div",{className:"p-3 sm:p-4 bg-gray-100 border-t",children:s.jsxs("div",{className:`grid gap-3 ${m?"grid-cols-1 sm:grid-cols-3":"grid-cols-1 sm:grid-cols-2"}`,children:[s.jsxs("button",{onClick:f,disabled:u,className:"bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-4 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-base sm:text-sm touch-manipulation order-1",style:{minHeight:"48px"},children:[s.jsx("span",{className:"ml-2 text-xl sm:text-lg",children:"🖨️"}),u?"جاري الطباعة...":"طباعة"]}),m&&s.jsxs("button",{onClick:b,disabled:x,className:"bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-base sm:text-sm touch-manipulation order-2",style:{minHeight:"48px"},children:[s.jsx("span",{className:"ml-2 text-xl sm:text-lg",children:"📤"}),x?"جاري المشاركة...":"مشاركة"]}),s.jsxs("button",{onClick:n=>{n.preventDefault(),n.stopPropagation(),i()},className:`bg-red-500 hover:bg-red-600 text-white font-bold py-4 sm:py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-base sm:text-sm touch-manipulation ${m?"order-3":"order-2"}`,style:{minHeight:"48px"},children:[s.jsx("span",{className:"ml-2 text-xl sm:text-lg",children:"✖️"}),"إغلاق"]})]})})]})});return w.createPortal(o,document.body)};export{N as T,j as u};
