import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoiceData {
  shopName: string;
  phone: string;
  address: string;
  invoiceNumber: string;
  createdAt: Date;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: Array<{
    name: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  currency: '₩' | 'đ';
  thankYouMessage: string;
}

/**
 * Remove Vietnamese accents from a string for filenames
 */
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Format currency based on the currency symbol
 */
function formatAmount(amount: number, currency: string): string {
  if (currency === '₩') {
    return new Intl.NumberFormat('en-US').format(amount);
  } else {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  }
}

/**
 * Export invoice to A7 PDF using html2canvas + jsPDF
 */
export async function exportInvoiceToPDF(data: InvoiceData, autoPrint = false): Promise<void> {
  // 1. Create a hidden div for the template
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.id = 'invoice-pdf-template';

  const dateStr = data.createdAt.toLocaleTimeString('vi-VN', { hour12: false }) + ' ' + 
                  data.createdAt.toLocaleDateString('vi-VN');

  // Helper for currency spacing
  const currencySymbol = data.currency;

  container.innerHTML = `
    <div style="width: 280px; font-family: 'Be Vietnam Pro', 'Noto Sans', sans-serif; background: white; padding: 12px 14px; color: #000; line-height: 1.5; box-sizing: border-box;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 8px;">
        <div style="font-size: 15px; font-weight: 800; text-transform: uppercase;">${data.shopName}</div>
        <div style="font-size: 9px; margin-top: 2px;">SĐT: ${data.phone}</div>
        <div style="font-size: 9px;">Đ/C: ${data.address}</div>
        <div style="border-top: 1px dashed #999; margin: 8px 0;"></div>
        <div style="font-size: 8px; font-weight: 600;">Mã HĐ: ${data.invoiceNumber}</div>
        <div style="font-size: 8px;">${dateStr}</div>
      </div>

      <!-- Customer -->
      <div style="font-size: 8px; margin-bottom: 8px;">
        <div>Khách hàng: ${data.customer.name}</div>
        <div>SĐT: ${data.customer.phone}</div>
        <div>Đ/C: ${data.customer.address}</div>
      </div>

      <div style="border-top: 1px dashed #999; margin: 4px 0;"></div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 6px;">
        <thead>
          <tr style="font-weight: 600; border-bottom: 1px dashed #ccc;">
            <th style="text-align: left; padding: 4px 0; width: 38%;">Tên món</th>
            <th style="text-align: right; padding: 4px 0; width: 22%;">Đ.Giá</th>
            <th style="text-align: center; padding: 4px 0; width: 12%;">SL</th>
            <th style="text-align: right; padding: 4px 0; width: 28%;">T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr style="border-bottom: 1px dashed #eee;">
              <td style="padding: 4px 0; vertical-align: top;">${item.name}</td>
              <td style="text-align: right; padding: 4px 0; vertical-align: top;">${formatAmount(item.unitPrice, currencySymbol).replace(' đ', '')}</td>
              <td style="text-align: center; padding: 4px 0; vertical-align: top;">${item.quantity}</td>
              <td style="text-align: right; padding: 4px 0; vertical-align: top;">${formatAmount(item.subtotal, currencySymbol).replace(' đ', '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="font-size: 8px; border-top: 1px dashed #999; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Tổng tiền hàng:</span>
          <span>${currencySymbol === '₩' ? '₩' : ''}${formatAmount(data.subtotal, currencySymbol)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Phí ship:</span>
          <span>${currencySymbol === '₩' ? '₩' : ''}${formatAmount(data.shippingFee, currencySymbol)}</span>
        </div>
        <div style="border-top: 1px dashed #ccc; margin: 4px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800;">
          <span>TỔNG CỘNG:</span>
          <span>${currencySymbol === '₩' ? '₩' : ''}${formatAmount(data.total, currencySymbol)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px;">
          <span>Hình thức:</span>
          <span>${data.paymentMethod}</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px dashed #999; margin: 10px 0 4px 0;"></div>
      <div style="text-align: center; font-size: 8px; font-style: italic; white-space: pre-line;">
        ${data.thankYouMessage}
      </div>
      <div style="border-top: 1px dashed #999; margin: 4px 0;"></div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // 2. Wait for fonts
    await document.fonts.ready;

    // 3. html2canvas capture
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    // 4. jsPDF setup A7 [74, 105] mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [74, 105],
    });

    // Calculate ratio to fit A7
    const imgWidth = 74;
    const canvasRatio = canvas.width / canvas.height;
    const pdfRatio = 74 / 105;

    let finalWidth, finalHeight;
    if (canvasRatio > pdfRatio) {
      finalWidth = 74;
      finalHeight = 74 / canvasRatio;
    } else {
      finalHeight = 105;
      finalWidth = 105 * canvasRatio;
    }

    // Center horizontally if needed
    pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);

    // 5. Action
    if (autoPrint) {
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } else {
      const safeCustomerName = removeAccents(data.customer.name).replace(/\s+/g, '');
      const filename = `${data.invoiceNumber}_${safeCustomerName}.pdf`;
      pdf.save(filename);
    }
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  } finally {
    // Cleanup
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}
