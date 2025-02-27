// 📌 Khi trang web tải xong, thêm sự kiện vào các nút
document.addEventListener('DOMContentLoaded', async () => {
    // 🌍 Các phần tử DOM
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const homeInterface = document.getElementById('connect-interface'); // Trang home
    const swapInterface = document.getElementById('swap-interface'); // Trang swap

    // 🔗 Cấu hình Blockchain
    let provider, signer;
    const RPC_URL = "https://rpc.viction.xyz"; // RPC mạng Viction
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // Token VIN
    let walletAddress = null;

    // 🔗 ABI của token VIN (Chuẩn ERC-20)
    const vinTokenABI = [
        {
            "constant": true,
            "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "balance", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    // 🦊 Kết nối ví MetaMask bằng Web3Provider
    async function connectWallet() {
        try {
            if (!window.ethereum) {
                alert("MetaMask is not installed!");
                return;
            }
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            // Kết nối hợp đồng VIN Token với signer
            vinTokenContract = new ethers.Contract(vinTokenAddress, vinTokenABI, signer);

            // 📝 Hiển thị địa chỉ ví
            walletAddressDisplay.textContent = `Wallet: ${walletAddress}`;

            // ✅ Hiện giao diện swap, ẩn home
            showSwapInterface();

            // ✅ Kiểm tra số dư VIC & VIN
            checkBalances();
        } catch (error) {
            alert("Failed to connect wallet!");
            console.error(error);
        }
    }

    // 🏦 Hàm kiểm tra số dư VIC & VIN
    async function checkBalances() {
        try {
            if (!walletAddress) return;

            // 🏦 Lấy số dư VIC (Native Coin)
            const balanceVic = await provider.getBalance(walletAddress);
            const formattedVic = ethers.utils.formatEther(balanceVic);

            // 🏦 Lấy số dư VIN bằng signer thay vì provider
            const balanceVin = await vinTokenContract.balanceOf(walletAddress);
            const formattedVin = ethers.utils.formatUnits(balanceVin, 18);

            // 📝 Hiển thị số dư trên giao diện
            fromTokenInfo.textContent = `VIC: ${formattedVic}`;
            toTokenInfo.textContent = `VIN: ${formattedVin}`;
        } catch (error) {
            console.error("❌ Lỗi khi nhận số dư:", error);
        }
    }

    // 🎯 Kết nối ví khi nhấn nút
    connectWalletButton.addEventListener("click", connectWallet);

    // 🔌 Ngắt kết nối ví
    disconnectWalletButton.addEventListener("click", async () => {
        try {
            walletAddress = null;
            walletAddressDisplay.textContent = "";
            fromTokenInfo.textContent = "VIC: 0.0000";
            toTokenInfo.textContent = "VIN: 0.0000";

            // Ẩn giao diện swap, hiện home
            showConnectInterface();

            alert("Wallet disconnected successfully.");
        } catch (error) {
            console.error("Error disconnecting wallet:", error);
            alert("Failed to disconnect wallet. Please try again.");
        }
    });

    // 📌 Hiển thị giao diện Swap (Ẩn home)
    function showSwapInterface() {
        homeInterface.style.display = "none";
        swapInterface.style.display = "block";
    }

    // 📌 Hiển thị giao diện Home (Ẩn swap)
    function showConnectInterface() {
        homeInterface.style.display = "block";
        swapInterface.style.display = "none";
    }
});
