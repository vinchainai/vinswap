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
// 🌐 Kết nối với Blockchain Viction (Chain ID 88)
const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer; // Chứa thông tin người dùng (ví)

// 📌 Địa chỉ hợp đồng thông minh VIN Swap & VIN Token
const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

// 🏦 Các biến lưu trữ số dư
let walletAddress = null;
let balances = { VIC: 0, VIN: 0 };

// 📌 ABI của VIN Swap & VIN Token để lấy số dư
const vinSwapABI = [
    { "inputs": [], "name": "swapVicToVin", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }], "name": "swapVinToVic", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

const vinABI = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// 🌍 Kết nối hợp đồng
let vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, provider);
let vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, provider);

// 🔄 Hàm kết nối ví
async function connectWallet() {
    try {
        // 🦊 Yêu cầu quyền kết nối từ MetaMask
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // 🔌 Kết nối signer
        signer = provider.getSigner();
        walletAddress = await signer.getAddress();

        // 🎉 Hiển thị địa chỉ ví lên giao diện
        document.getElementById("wallet-address").textContent = `Connected: ${walletAddress}`;

        // 🔄 Cập nhật số dư
        await updateBalances();

        // 🎭 Hiển thị giao diện Swap, ẩn giao diện Connect
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';

    } catch (error) {
        console.error("❌ Kết nối ví thất bại:", error);
        alert("⚠️ Failed to connect wallet. Please try again!");
    }
}

// 🔄 Hàm lấy số dư VIC & VIN
async function updateBalances() {
    try {
        // 🏦 Lấy số dư VIC (Native Coin)
        balances.VIC = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));

        // 🏦 Lấy số dư VIN (Token ERC-20)
        const vinBalanceRaw = await vinTokenContract.balanceOf(walletAddress);
        balances.VIN = parseFloat(ethers.utils.formatUnits(vinBalanceRaw, 18));

        // 📌 Hiển thị số dư lên giao diện
        document.getElementById("from-token-info").textContent = `VIC: ${balances.VIC.toFixed(4)}`;
        document.getElementById("to-token-info").textContent = `VIN: ${balances.VIN.toFixed(4)}`;
    } catch (error) {
        console.error("❌ Lỗi khi lấy số dư:", error);
        alert("⚠️ Failed to fetch balances. Please try again!");
    }
}

// 🖱️ Khi bấm "Connect Wallet"
document.getElementById("connect-wallet").addEventListener("click", connectWallet);
