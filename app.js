// 📌 Sự kiện chạy khi trang đã tải hoàn tất
document.addEventListener('DOMContentLoaded', async () => {

    // 🔗 DOM Elements - Các phần tử HTML cần thao tác
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

    // 🌐 Cấu hình blockchain
    const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38"; // Hợp đồng Swap VIN/VIC
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // VIN Token
    const rpcUrl = "https://rpc.viction.xyz"; // RPC mạng Viction

    const RATE = 100; // 1 VIN = 100 VIC
    const FEE = 0.01; // Phí swap cố định 0.01 VIC

    // 🌐 ABI hợp đồng thông minh
    const vinSwapABI = [
        { "inputs": [], "name": "swapVicToVin", "outputs": [], "stateMutability": "payable", "type": "function" },
        { "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }], "name": "swapVinToVic", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
    ];

    const vinABI = [
        { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
        { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
    ];

    // 🌐 Khởi tạo provider
    const rpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
    let provider, signer, userAddress;

    let fromToken = "VIC";
    let toToken = "VIN";
    let balances = { VIC: 0, VIN: 0 };

    // 🦊 Kết nối ví MetaMask
    connectWalletButton.addEventListener("click", async () => {
        try {
            if (!window.ethereum) {
                alert("MetaMask is not installed. Please install MetaMask!");
                return;
            }

            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);

            const network = await provider.getNetwork();
            if (network.chainId !== 88) { // Kiểm tra mạng có phải Viction không
                alert("Please switch to the Viction network in MetaMask!");
                return;
            }

            signer = provider.getSigner();
            userAddress = await signer.getAddress();

            walletAddressDisplay.textContent = `🟢 ${userAddress}`;
            document.getElementById("connect-interface").style.display = "none";
            document.getElementById("swap-interface").style.display = "block";

            await getBalances();
        } catch (error) {
            console.error("❌ Error connecting wallet:", error);
            alert("Failed to connect wallet. Please try again!");
        }
    });

    // 🔌 Ngắt kết nối ví
    disconnectWalletButton.addEventListener("click", () => {
        document.getElementById("swap-interface").style.display = "none";
        document.getElementById("connect-interface").style.display = "block";
    });

    // 🔄 Lấy số dư VIC & VIN
    async function getBalances() {
        try {
            balances.VIC = parseFloat(ethers.utils.formatEther(await provider.getBalance(userAddress)));

            const vinContract = new ethers.Contract(vinTokenAddress, vinABI, provider);
            balances.VIN = parseFloat(ethers.utils.formatUnits(await vinContract.balanceOf(userAddress), 18));

            updateTokenDisplay();
        } catch (error) {
            console.error("❌ Error fetching balance:", error);
        }
    }

    // 🔄 Cập nhật số dư trên giao diện
    function updateTokenDisplay() {
        fromTokenInfo.textContent = `${fromToken}: ${balances[fromToken].toFixed(4)}`;
        toTokenInfo.textContent = `${toToken}: ${balances[toToken].toFixed(4)}`;
    }

    // 🔄 Xử lý nút "Max"
    maxButton.addEventListener("click", () => {
        fromAmountInput.value = balances[fromToken];
        calculateToAmount();
    });

    // 🔄 Xử lý nút "Mũi tên" (Đảo chiều swap VIC ↔ VIN)
    swapDirectionButton.addEventListener("click", () => {
        [fromToken, toToken] = [toToken, fromToken];
        [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];

        updateTokenDisplay();
        fromAmountInput.value = "";
        toAmountInput.value = "";
    });

    // 🔄 Tính số lượng swap
    fromAmountInput.addEventListener("input", calculateToAmount);

    function calculateToAmount() {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            toAmountInput.value = "";
            return;
        }

        let receivingAmount;
        if (fromToken === "VIC") {
            receivingAmount = (fromAmount - FEE) / RATE;
        } else {
            receivingAmount = fromAmount * RATE - FEE;
        }

        toAmountInput.value = receivingAmount > 0 ? receivingAmount.toFixed(4) : "0.0000";
    }

    // 🔄 Swap VIC ↔ VIN
    swapNowButton.addEventListener("click", async () => {
        if (!signer) {
            alert("Please connect your wallet first!");
            return;
        }

        let fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            alert("Please enter a valid amount!");
            return;
        }

        try {
            const vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, signer);
            let tx;
            
            if (fromToken === "VIC") {
                tx = await vinSwapContract.swapVicToVin({ value: ethers.utils.parseEther(fromAmount.toString()) });
            } else {
                const vinAmount = ethers.utils.parseUnits(fromAmount.toString(), 18);
                const vinContract = new ethers.Contract(vinTokenAddress, vinABI, signer);

                const approveTx = await vinContract.approve(vinSwapAddress, vinAmount);
                await approveTx.wait();

                tx = await vinSwapContract.swapVinToVic(vinAmount);
            }

            await tx.wait();
            alert("Swap successful!");
            await getBalances();
        } catch (error) {
            console.error("❌ Swap failed:", error);
            alert("Swap failed! Please check and try again.");
        }
    });
});
