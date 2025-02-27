// 📌 URL Binance API để lấy giá VIC theo USD
const BINANCE_API_URL = "https://api.binance.com/api/v3/ticker/price?symbol=VICUSDT";

// 🔄 Hàm cập nhật giá VIN
async function updateVinPrice() {
    try {
        const response = await fetch(BINANCE_API_URL);
        const data = await response.json();

        if (!data || !data.price) {
            throw new Error("Không lấy được giá VIC từ Binance API");
        }

        const vicPrice = parseFloat(data.price); // Giá VIC theo USD
        const vinPrice = vicPrice * 100; // 1 VIN = 100 VIC

        // Hiển thị giá trên thanh điều hướng
        document.getElementById("vin-price").textContent = `1 VIN = ${vinPrice.toFixed(2)} USD`;
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật giá VIN:", error);
        document.getElementById("vin-price").textContent = "Price unavailable";
    }
}

// 🚀 Gọi ngay khi trang tải
updateVinPrice();

// 🔄 Cập nhật mỗi 60 giây
setInterval(updateVinPrice, 60000);
