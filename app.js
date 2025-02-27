// 🎯 Kết nối ví MetaMask, lấy số dư VIC & VIN, xử lý Max & Swap Direction
document.addEventListener("DOMContentLoaded", async () => {
    // 🔹 DOM Elements
    const connectButton = document.getElementById("connect-wallet");
    const disconnectButton = document.getElementById("disconnect-wallet");
    const homeInterface = document.getElementById("connect-interface");
    const swapInterface = document.getElementById("swap-interface");
    const walletAddressDisplay = document.getElementById("wallet-address");
    const fromTokenInfo = document.getElementById("from-token-info");
    const toTokenInfo = document.getElementById("to-token-info");
    const fromAmountInput = document.getElementById("from-amount");
    const toAmountInput = document.getElementById("to-amount");
    const fromTokenLogo = document.getElementById("from-token-logo");
    const toTokenLogo = document.getElementById("to-token-logo");
    const maxButton = document.getElementById("max-button");
    const swapDirectionButton = document.getElementById("swap-direction");

    // 🔹 Blockchain Config
    let provider, signer, userAddress;
    let vicBalance = 0;
    let vinBalance = 0;
    let isSwappingVicToVin = true; // ✅ Ban đầu swap VIC -> VIN

    // ✅ Kiểm tra nếu trình duyệt đã cài đặt MetaMask
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed! Please install MetaMask to use VinSwap.");
        return;
    }

    // 🌐 Khởi tạo provider từ MetaMask
    provider = new ethers.providers.Web3Provider(window.ethereum);

    // 📌 Sự kiện khi nhấn nút "Connect Wallet"
    connectButton.addEventListener("click", async () => {
        try {
            // 🚀 Gửi yêu cầu kết nối tài khoản MetaMask
            const accounts = await provider.send("eth_requestAccounts", []);
            userAddress = accounts[0];

            // ✅ Lấy signer để thực hiện giao dịch
            signer = provider.getSigner();
            walletAddressDisplay.textContent = `🟢 ${userAddress}`;

            // Ẩn giao diện Home, hiển thị giao diện Swap
            homeInterface.style.display = "none";
            swapInterface.style.display = "block";

            // 🏦 Gọi hàm lấy số dư VIC & VIN
            await getBalances(userAddress);
        } catch (error) {
            console.error("❌ Error connecting to MetaMask:", error);
            alert("Failed to connect to MetaMask. Please try again!");
        }
    });

    // 🔌 Sự kiện khi nhấn nút "Disconnect Wallet"
    disconnectButton.addEventListener("click", () => {
        swapInterface.style.display = "none";
        homeInterface.style.display = "block";
    });

    // 🔄 Hàm lấy số dư VIC & VIN
    async function getBalances(address) {
        try {
            // 🛠 Sử dụng JsonRpcProvider để lấy số dư VIC từ RPC của Viction
            const rpcProvider = new ethers.providers.JsonRpcProvider("https://rpc.viction.xyz");

            // 🏦 Lấy số dư VIC (Native Coin)
            const vicBalanceRaw = await rpcProvider.getBalance(address);
            vicBalance = ethers.utils.formatEther(vicBalanceRaw);

            // 🏦 Lấy số dư VIN (ERC-20)
            const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";
            const vinABI = [
                {
                    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
                    "name": "balanceOf",
                    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                    "stateMutability": "view",
                    "type": "function"
                }
            ];
            const vinContract = new ethers.Contract(vinTokenAddress, vinABI, rpcProvider);
            const vinBalanceRaw = await vinContract.balanceOf(address);
            vinBalance = ethers.utils.formatUnits(vinBalanceRaw, 18);

            // ✅ Cập nhật hiển thị số dư
            updateTokenDisplay();
        } catch (error) {
            console.error("❌ Error fetching balances:", error);
            alert("Failed to fetch VIC/VIN balances. Check the console for details.");
        }
    }

    // 🔄 Cập nhật số dư hiển thị theo hướng swap
    function updateTokenDisplay() {
        if (isSwappingVicToVin) {
            fromTokenInfo.textContent = `VIC: ${parseFloat(vicBalance).toFixed(4)}`;
            toTokenInfo.textContent = `VIN: ${parseFloat(vinBalance).toFixed(4)}`;
        } else {
            fromTokenInfo.textContent = `VIN: ${parseFloat(vinBalance).toFixed(4)}`;
            toTokenInfo.textContent = `VIC: ${parseFloat(vicBalance).toFixed(4)}`;
        }
    }

    // 🎯 Xử lý nút "Max" để nhập toàn bộ số dư vào ô input
    maxButton.addEventListener("click", () => {
        if (isSwappingVicToVin) {
            fromAmountInput.value = parseFloat(vicBalance).toFixed(4);
        } else {
            fromAmountInput.value = parseFloat(vinBalance).toFixed(4);
        }

        calculateToAmount();
    });

    // 🎯 Xử lý nút mũi tên để hoán đổi token swap
    swapDirectionButton.addEventListener("click", () => {
        isSwappingVicToVin = !isSwappingVicToVin; // Đảo ngược trạng thái swap

        // 🔄 Đổi mã ký hiệu token
        [fromTokenInfo.textContent, toTokenInfo.textContent] = [toTokenInfo.textContent, fromTokenInfo.textContent];

        // 🔄 Đổi logo token
        [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];

        // 🔄 Xóa giá trị input sau khi hoán đổi
        fromAmountInput.value = "";
        toAmountInput.value = "";

        calculateToAmount(); // ✅ Cập nhật lại số dư đúng theo hướng swap mới
    });

    // 🎯 Tính toán số lượng token nhận được sau swap
    function calculateToAmount() {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            toAmountInput.value = "";
            return;
        }

        const RATE = 100; // ✅ 1 VIN = 100 VIC

        let toAmount;
        if (isSwappingVicToVin) {
            toAmount = (fromAmount / RATE).toFixed(4);
        } else {
            toAmount = (fromAmount * RATE).toFixed(4);
        }

        toAmountInput.value = toAmount;
    }

    // 🎯 Sự kiện khi nhập số lượng token từ
    fromAmountInput.addEventListener("input", calculateToAmount);
});
