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

    // ✅ Kiểm tra nếu MetaMask đã được cài đặt
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask chưa được cài đặt! Vui lòng cài đặt MetaMask để sử dụng VinSwap.");
        return;
    }

    // 🌐 Khởi tạo provider từ MetaMask
    provider = new ethers.providers.Web3Provider(window.ethereum);

    // 📌 Kết nối ví MetaMask
    connectButton.addEventListener("click", async () => {
        try {
            const accounts = await provider.send("eth_requestAccounts", []);
            userAddress = accounts[0];

            signer = provider.getSigner();
            walletAddressDisplay.textContent = `🟢 ${userAddress}`;

            // Ẩn giao diện Home, hiển thị giao diện Swap
            homeInterface.style.display = "none";
            swapInterface.style.display = "block";

            // Gọi hàm lấy số dư VIC & VIN
            await getBalances();
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

    // 🔄 Hàm lấy số dư VIC & VIN
    async function getBalances() {
        try {
            // 🏦 Lấy số dư VIC
            const vicBalanceRaw = await provider.getBalance(userAddress);
            const vicBalance = ethers.utils.formatEther(vicBalanceRaw);
            fromTokenInfo.textContent = `VIC: ${parseFloat(vicBalance).toFixed(4)}`;

            // 🏦 Lấy số dư VIN (ERC-20)
            const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";
            const vinABI = [
                {
                    "constant": true,
                    "inputs": [{ "name": "owner", "type": "address" }],
                    "name": "balanceOf",
                    "outputs": [{ "name": "balance", "type": "uint256" }],
                    "type": "function"
                }
            ];
            const vinContract = new ethers.Contract(vinTokenAddress, vinABI, provider);
            const vinBalanceRaw = await vinContract.balanceOf(userAddress);
            const vinBalance = ethers.utils.formatUnits(vinBalanceRaw, 18);
            toTokenInfo.textContent = `VIN: ${parseFloat(vinBalance).toFixed(4)}`;
        } catch (error) {
            console.error("❌ Lỗi khi lấy số dư:", error);
        }
    }
});
