// 🚀 VinSwap - Kết nối ví & Hiển thị số dư

document.addEventListener('DOMContentLoaded', () => {
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');

    let provider, signer, userAddress;
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";
    const vinABI = [
        { "constant": true, "inputs": [{ "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" }
    ];

    async function connectWallet() {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            userAddress = await signer.getAddress();

            walletAddressDisplay.textContent = `Connected: ${userAddress.substring(0, 6)}...${userAddress.slice(-4)}`;
            document.getElementById("connect-interface").style.display = "none";
            document.getElementById("swap-interface").style.display = "block";

            updateBalances();
        } catch (error) {
            console.error("Wallet connection failed:", error);
            alert("Failed to connect wallet.");
        }
    }

    async function updateBalances() {
        if (!userAddress) return;

        try {
            const vicBalance = await provider.getBalance(userAddress);
            const formattedVicBalance = ethers.utils.formatEther(vicBalance);

            const vinContract = new ethers.Contract(vinTokenAddress, vinABI, provider);
            const vinBalance = await vinContract.balanceOf(userAddress);
            const formattedVinBalance = ethers.utils.formatUnits(vinBalance, 18);

            fromTokenInfo.textContent = `VIC: ${formattedVicBalance}`;
            toTokenInfo.textContent = `VIN: ${formattedVinBalance}`;
        } catch (error) {
            console.error("Error fetching balances:", error);
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
