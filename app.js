// Sự kiện chạy khi trang đã tải hoàn tất
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const swapDirectionButton = document.getElementById('swap-direction');
    const maxButton = document.getElementById('max-button');
    const swapNowButton = document.getElementById('swap-now');
    const transactionFeeDisplay = document.getElementById('transaction-fee');

    // Blockchain Config
    const RPC_URL = "https://rpc.viction.xyz";
    const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

    const RATE = 100; // 1 VIN = 100 VIC
    const FEE = 0.01; // 0.01 VIC swap fee

    const vinSwapABI = [
        {
            "inputs": [],
            "name": "swapVicToVin",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "vinAmount", "type": "uint256" }],
            "name": "swapVinToVic",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    const vinABI = [
        {
            "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    let provider, signer;
    let vinSwapContract, vinTokenContract;
    let walletAddress = null;
    let balances = { VIC: 0, VIN: 0 };
    let fromToken = 'VIC';
    let toToken = 'VIN';

    // ✅ Dùng provider RPC riêng để đảm bảo lấy số dư chính xác
    const staticProvider = new ethers.providers.JsonRpcProvider(RPC_URL);

    // ✅ Kết nối ví
    async function connectWallet() {
        try {
            if (window.ethereum) {
                provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
            } else {
                alert("Vui lòng sử dụng MetaMask hoặc ví hỗ trợ Viction.");
                return;
            }

            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            // ✅ Kết nối hợp đồng thông minh
            vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, signer);
            vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, staticProvider); // Dùng staticProvider thay vì signer

            walletAddressDisplay.textContent = walletAddress;
            await updateBalances();
            showSwapInterface();
        } catch (error) {
            console.error("Kết nối ví thất bại:", error);
            alert('Kết nối ví thất bại. Vui lòng thử lại.');
        }
    }

    // ✅ Cập nhật số dư VIC & VIN
    async function updateBalances() {
        try {
            console.log("🔍 Kiểm tra số dư của ví:", walletAddress);

            // 🏦 Lấy số dư VIC (Native Coin)
            const vicBalanceRaw = await provider.getBalance(walletAddress);
            balances.VIC = parseFloat(ethers.utils.formatEther(vicBalanceRaw));
            console.log(`✅ Số dư VIC: ${balances.VIC}`);

            // 🏦 Lấy số dư VIN từ hợp đồng Token (Dùng staticProvider để đảm bảo chính xác)
            const vinBalanceRaw = await vinTokenContract.balanceOf(walletAddress);
            balances.VIN = parseFloat(ethers.utils.formatUnits(vinBalanceRaw, 18));
            console.log(`✅ Số dư VIN: ${balances.VIN}`);

            updateTokenDisplay();
        } catch (error) {
            console.error('❌ Lỗi khi cập nhật số dư:', error);
        }
    }

    function updateTokenDisplay() {
        fromTokenInfo.textContent = `${fromToken}: ${balances[fromToken].toFixed(6)}`;
        toTokenInfo.textContent = `${toToken}: ${balances[toToken].toFixed(6)}`;
    }

    // ✅ Nút Max
    maxButton.addEventListener('click', () => {
        fromAmountInput.value = balances[fromToken];
        calculateToAmount();
    });

    // ✅ Tính toán số lượng token nhận được
    fromAmountInput.addEventListener('input', calculateToAmount);
    function calculateToAmount() {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            toAmountInput.value = '';
            return;
        }

        let netFromAmount, toAmount;

        if (fromToken === 'VIC') {
            netFromAmount = fromAmount - FEE;
            toAmount = netFromAmount > 0 ? (netFromAmount / RATE).toFixed(6) : '0.000000';
        } else {
            netFromAmount = fromAmount * RATE;
            toAmount = netFromAmount > FEE ? (netFromAmount - FEE).toFixed(6) : '0.000000';
        }

        toAmountInput.value = toAmount;
        transactionFeeDisplay.textContent = `Transaction Fee: ${FEE} VIC`;
    }

    // ✅ Nút hoán đổi VIC ↔ VIN
    swapDirectionButton.addEventListener('click', () => {
        [fromToken, toToken] = [toToken, fromToken];
        updateTokenDisplay();
        clearInputs();
    });

    function clearInputs() {
        fromAmountInput.value = '';
        toAmountInput.value = '';
    }

    // ✅ Kết nối & Ngắt kết nối ví
    connectWalletButton.addEventListener('click', connectWallet);
    disconnectWalletButton.addEventListener('click', () => {
        walletAddress = null;
        showConnectInterface();
    });

    function showSwapInterface() {
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';
    }

    function showConnectInterface() {
        document.getElementById('swap-interface').style.display = 'none';
        document.getElementById('connect-interface').style.display = 'block';
    }
});
