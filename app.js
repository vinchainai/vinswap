// 🚀 Sự kiện chạy khi trang đã tải hoàn tất
document.addEventListener('DOMContentLoaded', () => {
    // 🎯 DOM Elements
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

    // 🌐 Blockchain Config
    let provider, signer;
    let walletAddress = null;
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";
    const RPC_URL = "https://rpc.viction.xyz";
    const RATE = 100; // 1 VIN = 100 VIC
    const FEE = 0.01; // 0.01 VIC phí giao dịch

    const vinABI = [
        {
            "constant": true,
            "inputs": [{ "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "type": "function"
        }
    ];

    let vinTokenContract;

    // 🏦 Kết nối ví
    async function connectWallet() {
        try {
            if (window.ethereum) {
                provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                signer = await provider.getSigner();
                walletAddress = await signer.getAddress();
                walletAddressDisplay.textContent = walletAddress;

                // 🌍 Kết nối hợp đồng VIN Token
                vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, provider);

                // 🔄 Cập nhật số dư
                await updateBalances();
                showSwapInterface();
            } else {
                alert("❌ Bạn cần cài đặt MetaMask hoặc ví hỗ trợ Viction!");
            }
        } catch (error) {
            console.error("❌ Lỗi khi kết nối ví:", error);
        }
    }

    // 🏦 Ngắt kết nối ví
    function disconnectWallet() {
        walletAddress = null;
        walletAddressDisplay.textContent = "";
        fromTokenInfo.textContent = "VIC: 0.0000";
        toTokenInfo.textContent = "VIN: 0.0000";
        showConnectInterface();
        alert("🚀 Đã ngắt kết nối ví!");
    }

    // 🔄 Cập nhật số dư VIC & VIN (ĐÃ FIX)
    async function updateBalances() {
        try {
            if (!walletAddress) return;

            console.log("🔍 Kiểm tra số dư của ví:", walletAddress);

            // 🏦 Lấy số dư VIC (Native Coin)
            const vicBalanceRaw = await provider.getBalance(walletAddress);
            const vicBalance = ethers.utils.formatEther(vicBalanceRaw); // 🔥 FIX lỗi lấy số dư VIC
            console.log(`✅ Số dư VIC: ${vicBalance} VIC`);

            // 🏦 Lấy số dư VIN (Token ERC-20)
            const vinBalanceRaw = await vinTokenContract.balanceOf(walletAddress);
            const vinBalance = ethers.utils.formatUnits(vinBalanceRaw, 18);
            console.log(`✅ Số dư VIN: ${vinBalance} VIN`);

            // 🏦 Cập nhật UI
            fromTokenInfo.textContent = `VIC: ${parseFloat(vicBalance).toFixed(4)}`;
            toTokenInfo.textContent = `VIN: ${parseFloat(vinBalance).toFixed(4)}`;
        } catch (error) {
            console.error("❌ Lỗi khi lấy số dư:", error);
        }
    }

    // 🎯 Nút Max
    maxButton.addEventListener('click', async () => {
        fromAmountInput.value = fromTokenInfo.textContent.includes("VIC")
            ? parseFloat(fromTokenInfo.textContent.split(": ")[1])
            : parseFloat(toTokenInfo.textContent.split(": ")[1]);
        calculateToAmount();
    });

    // 🎯 Nút Swap Direction (Đổi VIC ⇄ VIN)
    swapDirectionButton.addEventListener('click', () => {
        [fromTokenInfo.textContent, toTokenInfo.textContent] = [toTokenInfo.textContent, fromTokenInfo.textContent];
        [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];
        fromAmountInput.value = "";
        toAmountInput.value = "";
    });

    // 🔄 Tính toán số token nhận được
    fromAmountInput.addEventListener('input', calculateToAmount);
    function calculateToAmount() {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            toAmountInput.value = "";
            return;
        }

        let toAmount;
        if (fromTokenInfo.textContent.includes("VIC")) {
            toAmount = (fromAmount - FEE) / RATE;
        } else {
            toAmount = (fromAmount * RATE) - FEE;
        }
        toAmountInput.value = toAmount.toFixed(4);
    }

    // 🎯 Nút Swap Now
    swapNowButton.addEventListener('click', async () => {
        alert("🚀 Chức năng Swap sẽ được cập nhật sau!");
    });

    // 🔄 Hiển thị giao diện Swap sau khi kết nối ví
    function showSwapInterface() {
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';
    }

    function showConnectInterface() {
        document.getElementById('swap-interface').style.display = 'none';
        document.getElementById('connect-interface').style.display = 'block';
    }

    // 🎯 Kết nối & Ngắt kết nối ví
    connectWalletButton.addEventListener('click', connectWallet);
    disconnectWalletButton.addEventListener('click', disconnectWallet);

    // 🚀 Khởi động giao diện
    showConnectInterface();
});
