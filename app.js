document.addEventListener('DOMContentLoaded', async () => {
    // 🌍 API giá VIC từ Binance
    const BINANCE_VIC_PRICE_API = "https://api.binance.com/api/v3/ticker/price?symbol=VICUSDT";
    
    // 🏦 Giá VIN theo USD (mặc định khi chưa có dữ liệu)
    let vinPriceUSD = "Loading price...";

    // 🏷️ Gán vào thanh điều hướng
    const vinPriceElement = document.getElementById('vin-price');

    // 🔄 Hàm lấy giá VIC từ Binance và tính giá VIN
    async function fetchVinPrice() {
        try {
            const response = await fetch(BINANCE_VIC_PRICE_API);
            const data = await response.json();

            if (data.price) {
                const vicPrice = parseFloat(data.price);
                vinPriceUSD = `1 VIN = ${(vicPrice * 100).toFixed(2)} USD`;
            } else {
                vinPriceUSD = "Error fetching price";
            }
        } catch (error) {
            console.error("❌ Lỗi khi lấy giá VIC:", error);
            vinPriceUSD = "Error fetching price";
        }

        // 📝 Cập nhật giao diện
        vinPriceElement.textContent = vinPriceUSD;
    }

    // 📡 Gọi hàm để cập nhật giá ngay khi tải trang
    await fetchVinPrice();

    // 🔄 Cập nhật giá mỗi 60 giây
    setInterval(fetchVinPrice, 60000);
});
