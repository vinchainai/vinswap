// 🎯 Kết nối ví MetaMask và lấy số dư VIC + VIN
document.addEventListener("DOMContentLoaded", async () => {
    const connectButton = document.getElementById("connect-wallet");
    const disconnectButton = document.getElementById("disconnect-wallet");
    const homeInterface = document.getElementById("connect-interface");
    const swapInterface = document.getElementById("swap-interface");
    const walletAddressDisplay = document.getElementById("wallet-address");
    const fromTokenInfo = document.getElementById("from-token-info");
    const toTokenInfo = document.getElementById("to-token-info");

    let provider, signer, userAddress;

    // ✅ Kiểm tra nếu trình duyệt đã cài đặt MetaMask chưa
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed! Please install MetaMask to use VinSwap.");
        return;
    }

    // 🌐 Khởi tạo provider từ MetaMask để kết nối blockchain
    provider = new ethers.providers.Web3Provider(window.ethereum);

    // 📌 Sự kiện khi nhấn nút "Connect Wallet"
    connectButton.addEventListener("click", async () => {
        try {
            // 🚀 Gửi yêu cầu kết nối tài khoản MetaMask
            const accounts = await provider.send("eth_requestAccounts", []);
            userAddress = accounts[0]; // Lấy địa chỉ ví của người dùng

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
        // Quay lại màn hình Home khi ngắt kết nối ví
        swapInterface.style.display = "none";
        homeInterface.style.display = "block";
    });

    // 🔄 Hàm lấy số dư VIC & VIN từ blockchain
    async function getBalances(address) {
        try {
            // 🛠 Sử dụng JsonRpcProvider để lấy số dư VIC từ RPC của Viction
            const rpcProvider = new ethers.providers.JsonRpcProvider("https://rpc.viction.xyz");

            // 🏦 Lấy số dư VIC (Native Coin của mạng VIC)
            const vicBalanceRaw = await rpcProvider.getBalance(address);
            const vicBalance = ethers.utils.formatEther(vicBalanceRaw);
            fromTokenInfo.textContent = `VIC: ${parseFloat(vicBalance).toFixed(4)}`;

            // 🏦 Lấy số dư VIN (Token ERC-20)
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

            // 🌍 Kết nối hợp đồng VIN Token để lấy số dư
            const vinContract = new ethers.Contract(vinTokenAddress, vinABI, rpcProvider);
            const vinBalanceRaw = await vinContract.balanceOf(address);
            const vinBalance = ethers.utils.formatUnits(vinBalanceRaw, 18);
            toTokenInfo.textContent = `VIN: ${parseFloat(vinBalance).toFixed(4)}`;
        } catch (error) {
            console.error("❌ Error fetching balances:", error);
            alert("Failed to fetch VIC/VIN balances. Check the console for details.");
        }
    }
});
