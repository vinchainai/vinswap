// 🚀 VinSwap - Kết nối ví & Hiển thị số dư (Fix lỗi CALL_EXCEPTION)

document.addEventListener('DOMContentLoaded', () => {
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');

    let provider, signer, userAddress;
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

    // ✅ Cập nhật ABI đầy đủ để ethers v5 nhận diện đúng
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
            provider = new ethers.providers.Web3Provider(window.ethereum); // ✅ Dùng ethers v5
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            userAddress = await signer.getAddress();

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
            // ✅ Lấy số dư VIC (Native Coin)
            const vicBalance = await provider.getBalance(userAddress);
            const formattedVicBalance = ethers.utils.formatEther(vicBalance);

            // ✅ Lấy số dư VIN (Token ERC-20)
            const vinContract = new ethers.Contract(vinTokenAddress, vinABI, provider);
            const vinBalance = await vinContract.balanceOf(userAddress);
            const formattedVinBalance = ethers.utils.formatUnits(vinBalance, 18);

            // ✅ Cập nhật UI
            fromTokenInfo.textContent = `VIC: ${formattedVicBalance}`;
            toTokenInfo.textContent = `VIN: ${formattedVinBalance}`;
            console.log(`✅ Số dư VIC: ${formattedVicBalance}, VIN: ${formattedVinBalance}`);
        } catch (error) {
            console.error("❌ Lỗi khi lấy số dư:", error);
            alert("🚨 Không thể lấy số dư, vui lòng kiểm tra lại mạng.");
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
