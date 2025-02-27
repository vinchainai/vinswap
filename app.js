// 📌 Khi trang web tải xong, thêm sự kiện vào các nút
document.addEventListener('DOMContentLoaded', async () => {
    // 🌍 Các phần tử DOM
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const fromTokenLogo = document.getElementById('from-token-logo');
    const toTokenLogo = document.getElementById('to-token-logo');
    const swapDirectionButton = document.getElementById('swap-direction');
    const maxButton = document.getElementById('max-button');
    const swapNowButton = document.getElementById('swap-now');

    // 🔗 Cấu hình Blockchain
    let provider, signer;
    const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38"; // Hợp đồng Swap
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // Token VIN
    const RPC_URL = "https://rpc.viction.xyz"; // RPC của mạng Viction

    // 🔥 Tỷ lệ swap và phí giao dịch
    const RATE = 100; // 1 VIN = 100 VIC
    const FEE = 0.01; // 0.01 VIC phí giao dịch

    // 🔗 ABI của hợp đồng VinSwap
    const vinSwapABI = [
        { "inputs": [], "name": "swapVicToVin", "outputs": [], "stateMutability": "payable", "type": "function" },
        { "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }], "name": "swapVinToVic", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
    ];

    // 🔗 ABI của token VIN
    const vinTokenABI = [
        { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
    ];

    let vinSwapContract, vinTokenContract;
    let walletAddress = null;
    let balances = { VIC: 0, VIN: 0 };
    let swapVicToVin = true; // true: swap VIC -> VIN, false: swap VIN -> VIC

    // 🦊 Kết nối ví MetaMask bằng ethers.js v5
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

            // Kết nối hợp đồng
            vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, signer);
            vinTokenContract = new ethers.Contract(vinTokenAddress, vinTokenABI, signer);

            // Cập nhật giao diện
            walletAddressDisplay.textContent = `Wallet: ${walletAddress}`;
            document.getElementById("connect-interface").style.display = "none";
            document.getElementById("swap-interface").style.display = "block";

            // Cập nhật số dư
            updateBalances();
        } catch (error) {
            alert("Failed to connect wallet!");
            console.error(error);
        }
    }

    // 🔄 Cập nhật số dư VIC & VIN
    async function updateBalances() {
        try {
            const balanceVic = await provider.getBalance(walletAddress);
            const balanceVin = await vinTokenContract.balanceOf(walletAddress);

            balances.VIC = parseFloat(ethers.utils.formatEther(balanceVic));
            balances.VIN = parseFloat(ethers.utils.formatUnits(balanceVin, 18));

            fromTokenInfo.textContent = swapVicToVin ? `VIC: ${balances.VIC.toFixed(4)}` : `VIN: ${balances.VIN.toFixed(4)}`;
            toTokenInfo.textContent = swapVicToVin ? `VIN: 0.0000` : `VIC: 0.0000`;
        } catch (error) {
            console.error("Error updating balances:", error);
        }
    }

    // 🔄 Xử lý đổi hướng swap
    swapDirectionButton.addEventListener("click", () => {
        swapVicToVin = !swapVicToVin;
        [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];
        updateBalances();
    });

    // 🔄 Xử lý nút Max
    maxButton.addEventListener("click", () => {
        fromAmountInput.value = swapVicToVin ? balances.VIC.toFixed(4) : balances.VIN.toFixed(4);
        calculateSwapAmount();
    });

    // 🔢 Tính toán số lượng nhận được
    fromAmountInput.addEventListener("input", calculateSwapAmount);
    function calculateSwapAmount() {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            toAmountInput.value = "0.0";
            return;
        }

        const fee = FEE;
        const toAmount = swapVicToVin
            ? (fromAmount / RATE) - fee
            : (fromAmount * RATE) - fee;

        toAmountInput.value = toAmount.toFixed(4);
    }

    // 🚀 Xử lý swap khi nhấn nút Swap Now
    swapNowButton.addEventListener("click", async () => {
        try {
            const fromAmount = parseFloat(fromAmountInput.value);
            if (isNaN(fromAmount) || fromAmount <= 0) {
                alert("Invalid amount!");
                return;
            }

            if (swapVicToVin) {
                // Swap VIC -> VIN
                const tx = await vinSwapContract.swapVicToVin({ value: ethers.utils.parseEther(fromAmount.toString()) });
                alert("Transaction submitted! Please wait...");
                await tx.wait();
            } else {
                // Swap VIN -> VIC
                const amountToSwap = ethers.utils.parseUnits(fromAmount.toString(), 18);
                await vinTokenContract.approve(vinSwapAddress, amountToSwap);
                const tx = await vinSwapContract.swapVinToVic(amountToSwap);
                alert("Transaction submitted! Please wait...");
                await tx.wait();
            }

            alert("Swap successful!");
            updateBalances();
        } catch (error) {
            alert("Swap failed!");
            console.error(error);
        }
    });

    // 🔌 Xử lý ngắt kết nối ví
    disconnectWalletButton.addEventListener("click", () => {
        walletAddress = null;
        document.getElementById("connect-interface").style.display = "block";
        document.getElementById("swap-interface").style.display = "none";
    });

    // 🎯 Kết nối ví khi nhấn nút
    connectWalletButton.addEventListener("click", connectWallet);
});
