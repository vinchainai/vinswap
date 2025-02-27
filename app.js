// 🎯 Khởi tạo biến toàn cục
let provider, signer, userAddress;
const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // VIN Token
const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38"; // Hợp đồng VinSwap
const rpcUrl = "https://rpc.viction.xyz"; // RPC mạng Viction

// 🌐 Khởi tạo provider từ RPC mạng Viction
const rpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

// 🎯 Khởi tạo các phần tử giao diện
const connectButton = document.getElementById("connect-wallet");
const disconnectButton = document.getElementById("disconnect-wallet");
const homeInterface = document.getElementById("connect-interface");
const swapInterface = document.getElementById("swap-interface");
const walletAddressDisplay = document.getElementById("wallet-address");
const fromTokenInfo = document.getElementById("from-token-info");
const toTokenInfo = document.getElementById("to-token-info");
const fromAmountInput = document.getElementById("from-amount");
const toAmountInput = document.getElementById("to-amount");

// ✅ Kiểm tra nếu MetaMask đã được cài đặt
if (!window.ethereum) {
    alert("MetaMask chưa được cài đặt! Vui lòng cài đặt MetaMask để sử dụng VinSwap.");
}

// 🌐 Khởi tạo provider từ MetaMask
provider = new ethers.providers.Web3Provider(window.ethereum);

// 📌 Xử lý sự kiện kết nối ví
connectButton.addEventListener("click", async () => {
    try {
        // 🔗 Yêu cầu kết nối ví MetaMask
        const accounts = await provider.send("eth_requestAccounts", []);
        userAddress = accounts[0];

        signer = provider.getSigner();
        walletAddressDisplay.textContent = `🟢 ${userAddress}`;

        // Ẩn giao diện Home, hiển thị giao diện Swap
        homeInterface.style.display = "none";
        swapInterface.style.display = "block";

        // Gọi hàm lấy số dư VIC & VIN
        await getBalances(userAddress);
    } catch (error) {
        console.error("❌ Lỗi khi kết nối MetaMask:", error);
        alert("Không thể kết nối MetaMask. Vui lòng thử lại!");
    }
});

// 🔌 Ngắt kết nối và quay lại màn hình Home
disconnectButton.addEventListener("click", () => {
    swapInterface.style.display = "none";
    homeInterface.style.display = "block";
});
