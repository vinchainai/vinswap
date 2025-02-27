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

// 🎯 Hàm lấy số dư VIC & VIN từ blockchain
async function getBalances(address) {
    try {
        // 🏦 Lấy số dư VIC (Native Coin)
        const vicBalanceRaw = await rpcProvider.getBalance(address);
        const vicBalance = ethers.utils.formatEther(vicBalanceRaw);
        fromTokenInfo.textContent = `VIC: ${parseFloat(vicBalance).toFixed(4)}`;

        // 🏦 Lấy số dư VIN (ERC-20 Token)
        const vinABI = [
            {
                "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
                "name": "balanceOf",
                "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        // 🔗 Kết nối hợp đồng VIN Token
        const vinContract = new ethers.Contract(vinTokenAddress, vinABI, rpcProvider);
        const vinBalanceRaw = await vinContract.balanceOf(address);
        const vinBalance = ethers.utils.formatUnits(vinBalanceRaw, 18);
        toTokenInfo.textContent = `VIN: ${parseFloat(vinBalance).toFixed(4)}`;
    } catch (error) {
        console.error("❌ Lỗi khi lấy số dư:", error);
        alert("Không thể lấy số dư VIC/VIN. Kiểm tra console để biết thêm chi tiết.");
    }
}

// 🎯 Xử lý nút "Max" (tự động điền số dư tối đa có thể swap)
const maxButton = document.getElementById("max-button");

maxButton.addEventListener("click", () => {
    const balanceText = fromTokenInfo.textContent; // Lấy số dư VIC hoặc VIN hiển thị
    const balance = parseFloat(balanceText.split(": ")[1]); // Lấy giá trị số dư

    if (!isNaN(balance) && balance > 0) {
        fromAmountInput.value = balance;
        calculateSwapAmount(); // Tự động tính toán số token nhận được
    } else {
        alert("Số dư không hợp lệ!");
    }
});

// 🎯 Xử lý nút "Mũi tên" (đảo chiều swap giữa VIC ↔ VIN)
const swapDirectionButton = document.getElementById("swap-direction");

swapDirectionButton.addEventListener("click", () => {
    // 🌐 Lấy thông tin hiện tại
    const fromToken = fromTokenInfo.textContent.split(":")[0].trim();
    const toToken = toTokenInfo.textContent.split(":")[0].trim();

    // 🔄 Đổi vị trí hiển thị
    fromTokenInfo.textContent = `${toToken}: 0.0000`;
    toTokenInfo.textContent = `${fromToken}: 0.0000`;

    // 🔄 Đổi biểu tượng token
    const fromLogo = document.getElementById("from-token-logo").src;
    document.getElementById("from-token-logo").src = document.getElementById("to-token-logo").src;
    document.getElementById("to-token-logo").src = fromLogo;

    // 🔄 Đổi placeholder input
    fromAmountInput.value = "";
    toAmountInput.value = "";

    // Cập nhật lại số dư để phản ánh sự thay đổi
    getBalances(userAddress);
});
