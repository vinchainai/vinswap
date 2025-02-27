// 🚀 VinSwap - Kết nối ví & Hiển thị số dư (Sửa lỗi CALL_EXCEPTION)
document.addEventListener('DOMContentLoaded', () => {
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');

    let provider, signer, userAddress;
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // ✅ Địa chỉ đúng trên Viction

    // ✅ Dùng ABI đầy đủ từ hợp đồng VIN trên Viction
    const vinABI = [
        {
            "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    async function connectWallet() {
        if (!window.ethereum) {
            alert("🚨 Vui lòng cài đặt MetaMask để sử dụng VinSwap!");
            return;
        }

        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            userAddress = await signer.getAddress();

            console.log("✅ Ví đã kết nối:", userAddress);
            walletAddressDisplay.textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.slice(-4)}`;
            document.getElementById("connect-interface").style.display = "none";
            document.getElementById("swap-interface").style.display = "block";

            updateBalances();
        } catch (error) {
            console.error("❌ Lỗi khi kết nối ví:", error);
            alert("🚨 Không thể kết nối ví, vui lòng thử lại.");
        }
    }

    async function updateBalances() {
        if (!userAddress) return;

        try {
            console.log("🔍 Đang kiểm tra số dư cho địa chỉ:", userAddress);

            // ✅ Lấy số dư VIC
            const vicBalance = await provider.getBalance(userAddress);
            const formattedVicBalance = ethers.utils.formatEther(vicBalance);
            console.log(`✅ Số dư VIC: ${formattedVicBalance}`);

            // ✅ Lấy số dư VIN từ hợp đồng
            const vinContract = new ethers.Contract(vinTokenAddress, vinABI, provider);
            const vinBalance = await vinContract.balanceOf(userAddress);
            const formattedVinBalance = ethers.utils.formatUnits(vinBalance, 18);
            console.log(`✅ Số dư VIN: ${formattedVinBalance}`);

            // ✅ Cập nhật UI
            fromTokenInfo.textContent = `VIC: ${formattedVicBalance}`;
            toTokenInfo.textContent = `VIN: ${formattedVinBalance}`;
        } catch (error) {
            console.error("❌ Lỗi khi lấy số dư VIN:", error);
            alert("🚨 Không thể lấy số dư, vui lòng kiểm tra lại mạng hoặc thử lại sau.");
        }
    }

    function disconnectWallet() {
        userAddress = null;
        walletAddressDisplay.textContent = "";
        document.getElementById("connect-interface").style.display = "block";
        document.getElementById("swap-interface").style.display = "none";
    }

    connectWalletButton.addEventListener('click', connectWallet);
    disconnectWalletButton.addEventListener('click', disconnectWallet);
});
