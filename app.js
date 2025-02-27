// 📌 API Binance lấy giá VIC theo USD
const BINANCE_API_URL = "https://api.binance.com/api/v3/ticker/price?symbol=VICUSDT";

// 🏷️ Chọn phần tử HTML để hiển thị giá VIN
const vinPriceElement = document.getElementById("vin-price");

// 🔄 Hàm cập nhật giá VIN theo USD
async function updateVinPrice() {
    try {
        // 🔍 Gọi API lấy giá VIC
        const response = await fetch(BINANCE_API_URL);
        const data = await response.json();

        if (!data || !data.price) {
            throw new Error("Không lấy được giá VIC từ Binance API");
        }

        const vicPrice = parseFloat(data.price); // Giá VIC theo USD
        const vinPrice = (vicPrice * 100).toFixed(2); // 1 VIN = 100 VIC

        // 🔥 Hiển thị giá VIN trên thanh điều hướng
        vinPriceElement.textContent = `1 VIN = ${vinPrice} USD`;
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật giá VIN:", error);
        vinPriceElement.textContent = "Price unavailable";
    }
}

// 🚀 Gọi hàm cập nhật giá ngay khi trang tải
updateVinPrice();

// 🔄 Cập nhật giá mỗi 30 giây
setInterval(updateVinPrice, 30000);
