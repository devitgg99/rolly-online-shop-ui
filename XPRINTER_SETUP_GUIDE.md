# 🖨️ XPRINTER Thermal Printer Setup Guide

## 🎯 Compatible XPRINTER Models

This receipt printing is optimized for:
- ✅ XPRINTER XP-80C
- ✅ XPRINTER XP-58
- ✅ XPRINTER XP-365B
- ✅ XPRINTER XP-C260
- ✅ Any 80mm thermal receipt printer

---

## 🔧 Windows Setup (One-Time)

### **Step 1: Install XPRINTER Driver**

1. Download driver from XPRINTER website or use the CD that came with your printer
2. Connect XPRINTER to your computer via USB
3. Install the driver
4. Restart your computer

### **Step 2: Set as Default Printer (Recommended)**

1. Open **Windows Settings** → **Devices** → **Printers & scanners**
2. Find your XPRINTER (e.g., "XP-80C" or "POS-80")
3. Click on it → **Manage**
4. Click **Set as default**

### **Step 3: Configure Printer Preferences**

1. In **Printers & scanners**, click your XPRINTER
2. Click **Printing preferences**
3. Set these options:

   **Paper/Quality Tab:**
   - Paper Size: **80mm** (or Custom: 80mm x 297mm)
   - Orientation: **Portrait**
   
   **Advanced Tab:**
   - Paper Size: **80mm Roll** or **Custom: 80mm x Auto**
   - Scaling: **100%**
   - Auto-cut: **Enabled** (if your printer supports it)

4. Click **Apply** → **OK**

---

## 🖨️ How to Print Receipts

### **From the Sales Page:**

1. **Create a sale** or **view an existing sale**
2. Click **"View Receipt"** button
3. Receipt preview will appear
4. Click the **"Print"** button (printer icon 🖨️)
5. Browser print dialog will appear
6. Select your **XPRINTER** from the printer list
7. Click **"Print"**
8. Receipt will print automatically! ✅

---

## ⚡ Quick Print (Auto-print)

If you set XPRINTER as your **default printer**, the receipt will print directly without showing the printer selection dialog.

**To enable auto-print:**
1. Set XPRINTER as default (see Step 2 above)
2. In browser print dialog, check **"Don't ask again"** (Chrome)
3. Future receipts will print instantly!

---

## 🎨 Receipt Format

The receipt is optimized for **80mm thermal paper**:

- ✅ Width: **80mm** (standard thermal paper)
- ✅ Length: **Auto** (prints only what's needed)
- ✅ Font: **Courier New** (monospace, thermal-printer friendly)
- ✅ Layout: Single column, easy to read
- ✅ Auto-cut support (if your printer has it)

**Receipt includes:**
- Store header (name, address, phone)
- Receipt ID & date
- Customer info (if provided)
- Cashier name
- Payment method
- Itemized list (product, qty, price, total)
- Subtotal, discount, total
- Notes (if any)
- Thank you footer
- Barcode ID

---

## 🔍 Troubleshooting

### **❌ Printer not found in list**

**Solution:**
1. Check XPRINTER is connected via USB
2. Check XPRINTER is powered on
3. Reinstall XPRINTER driver
4. Restart browser

### **❌ Receipt prints blank**

**Solution:**
1. Check thermal paper is installed correctly (thermal side facing up)
2. Check paper is not expired (thermal paper has shelf life)
3. Clean thermal print head with isopropyl alcohol
4. Check printer settings: Ensure "Print in grayscale" is enabled

### **❌ Receipt is cut off / doesn't fit**

**Solution:**
1. In XPRINTER preferences, set paper size to **"80mm x Auto"** or **"80mm x 297mm"**
2. Set orientation to **Portrait**
3. Set scaling to **100%**
4. Disable "Fit to page"

### **❌ Print dialog doesn't open**

**Solution:**
1. Check browser allows popups for your site
2. In Chrome: Click the popup icon in address bar → **"Always allow popups"**
3. Try again

### **❌ Text is too small / too large**

**Solution:**
1. In XPRINTER preferences, adjust **DPI/Resolution**:
   - Standard: **203 DPI**
   - High quality: **300 DPI**
2. Adjust **Scaling** (try 90%, 100%, or 110%)

### **❌ Receipt doesn't auto-cut**

**Solution:**
1. Check if your XPRINTER model supports auto-cut
2. In printer preferences, enable **"Auto-cut"** or **"Paper cut"**
3. Some models require pressing the feed button to cut

---

## 🎛️ Advanced Settings

### **For XP-80C / XP-58 (USB):**

**Windows Printer Preferences:**
```
Paper Size: 80mm x Auto
Orientation: Portrait
Quality: Standard (203 DPI)
Color: Grayscale
Auto-cut: Enabled
Speed: Fast
Darkness: Medium (adjust if too light/dark)
```

### **For Network XPRINTER (WiFi/Ethernet):**

1. Get printer's IP address (usually printed on config page)
2. Add network printer in Windows:
   - Settings → Printers → Add printer
   - Select "Add a printer using TCP/IP address"
   - Enter IP address
   - Install driver
3. Use same settings as USB

---

## 💡 Pro Tips

### **Tip 1: Test Print First**
Print a test receipt before your first real sale to ensure settings are correct.

### **Tip 2: Keep Paper Loaded**
Always check thermal paper level before starting sales.

### **Tip 3: Clean Print Head Monthly**
Clean with isopropyl alcohol and soft cloth for best print quality.

### **Tip 4: Use Quality Thermal Paper**
Use 80mm x 50m or 80mm x 80m thermal paper rolls (55-60 GSM recommended).

### **Tip 5: Keyboard Shortcut**
After clicking "Print", press **Ctrl+P** (or Cmd+P on Mac) to quickly open print dialog.

### **Tip 6: Multiple Copies**
In print dialog, set **"Copies: 2"** if you need customer + merchant copies.

---

## 📊 Recommended Settings Summary

| Setting | Value |
|---------|-------|
| Paper Size | 80mm x Auto |
| Orientation | Portrait |
| Margins | 0mm (all sides) |
| Scaling | 100% |
| Color | Grayscale |
| Quality | 203 DPI |
| Auto-cut | Enabled |
| Font | Courier New |

---

## 🧪 Test Your Setup

### **Quick Test:**

1. Go to Sales page
2. Create a test sale with 1-2 items
3. Click "View Receipt"
4. Click "Print"
5. Check the printed receipt for:
   - ✅ All text is visible and readable
   - ✅ Borders and lines are crisp
   - ✅ No text is cut off
   - ✅ Auto-cut works (if supported)
   - ✅ Receipt is centered on paper

---

## 📞 Common XPRINTER Models

### **XP-80C (Most Popular)**
- USB + Serial
- Auto-cutter: Yes
- Speed: 250mm/s
- Paper width: 80mm
- Recommended for: Small to medium shops

### **XP-58**
- USB
- Auto-cutter: Optional
- Speed: 90mm/s
- Paper width: 58mm
- Recommended for: Mobile shops, small kiosks

### **XP-365B**
- USB + Bluetooth
- Auto-cutter: Yes
- Speed: 260mm/s
- Paper width: 80mm
- Recommended for: POS systems, restaurants

---

## 🎯 Quick Start Checklist

Before first print:
- [ ] XPRINTER driver installed
- [ ] XPRINTER connected and powered on
- [ ] XPRINTER set as default printer (optional but recommended)
- [ ] Paper size set to 80mm x Auto
- [ ] Thermal paper loaded correctly
- [ ] Browser allows popups
- [ ] Test receipt printed successfully

---

## 🚀 You're Ready!

Your XPRINTER is now configured and ready to print receipts! 🎉

**Steps to print:**
1. Create/view sale
2. Click "View Receipt"
3. Click "Print" 🖨️
4. Select XPRINTER
5. Click "Print"
6. Done! ✅

---

## 📝 Notes

- Thermal paper is heat-sensitive (keep away from heat sources)
- Receipts may fade over time (this is normal for thermal printing)
- For archival, also download as PDF
- Keep spare thermal paper rolls in stock
- Most XPRINTER models have a feed button for manual paper advance

---

**Happy Printing!** 🖨️✨
