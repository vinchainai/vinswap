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
    const fromTokenLogo = document.getElementById('from-token-logo');
    const toTokenLogo = document.getElementById('to-token-logo');
    const swapDirectionButton = document.getElementById('swap-direction');
    const maxButton = document.getElementById('max-button');
    const swapNowButton = document.getElementById('swap-now');
    const transactionFeeDisplay = document.getElementById('transaction-fee');
    const gasFeeDisplay = document.getElementById('gas-fee');

    // Blockchain Config
    let provider, signer;
    let walletConnectProvider = null;
    const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";
    const RPC_URL = "https://rpc.viction.xyz";

    const RATE = 100; // 1 VIN = 100 VIC
    const FEE = 0.01; // 0.01 VIC swap fee
    const GAS_FEE_ESTIMATE = 0.000029; // Estimated gas fee

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
            "constant": true,
            "inputs": [{ "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "type": "function"
        }
    ];

    let vinSwapContract, vinTokenContract;
    let walletAddress = null;
    let balances = { VIC: 0, VIN: 0 };
    let fromToken = 'VIC';
    let toToken = 'VIN';

    // Kết nối ví
    async function connectWallet() {
        try {
            if (window.ethereum) {
                provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
            } else {
                walletConnectProvider = new WalletConnectProvider.default({
                    rpc: { 88: RPC_URL },
                    chainId: 88,
                    qrcode: false
                });

                await walletConnectProvider.enable();
                provider = new ethers.providers.Web3Provider(walletConnectProvider);
            }

            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            vinSwapContract = new ethers.Contract(vinSwapAddress, vinSwapABI, signer);
            vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, provider);

            walletAddressDisplay.textContent = walletAddress;
            await updateBalances();
            showSwapInterface();
        } catch (error) {
            console.error("Kết nối ví thất bại:", error);
            alert('Kết nối ví thất bại. Vui lòng thử lại.');
        }
    }

    // Cập nhật số dư
    async function updateBalances() {
        try {
            balances.VIC = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));
            balances.VIN = parseFloat(
                ethers.utils.formatUnits(await vinTokenContract.balanceOf(walletAddress), 18)
            );

            fromTokenInfo.textContent = `${fromToken}: ${balances[fromToken].toFixed(6)}`;
            toTokenInfo.textContent = `${toToken}: ${balances[toToken].toFixed(6)}`;
        } catch (error) {
            console.error('Lỗi khi cập nhật số dư:', error);
        }
    }

    // Chuyển đổi giữa VIC ↔ VIN
    swapDirectionButton.addEventListener('click', () => {
        [fromToken, toToken] = [toToken, fromToken];
        updateBalances();
    });

    // Swap Token
    swapNowButton.addEventListener('click', async () => {
        try {
            const fromAmount = parseFloat(fromAmountInput.value);
            if (isNaN(fromAmount) || fromAmount <= 0) {
                alert('Vui lòng nhập số lượng hợp lệ.');
                return;
            }

            if (fromToken === 'VIC') {
                const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());

                const tx = await vinSwapContract.swapVicToVin({ value: fromAmountInWei });
                await tx.wait();
                alert('Swap VIC → VIN thành công!');
            } else {
                const fromAmountInWei = ethers.utils.parseUnits(fromAmount.toString(), 18);

                const approveTx = await vinTokenContract.approve(vinSwapAddress, fromAmountInWei);
                await approveTx.wait();

                const tx = await vinSwapContract.swapVinToVic(fromAmountInWei);
                await tx.wait();
                alert('Swap VIN → VIC thành công!');
            }

            updateBalances();
        } catch (error) {
            console.error("Swap thất bại:", error);
            alert(`Lỗi khi swap: ${error.reason || error.message}`);
        }
    });

    // Nút kết nối ví
    connectWalletButton.addEventListener('click', async () => {
        connectWalletButton.textContent = "Connecting...";
        connectWalletButton.disabled = true;

        await connectWallet();

        connectWalletButton.textContent = "Connect Wallet";
        connectWalletButton.disabled = false;
    });

    // Nút ngắt kết nối
    disconnectWalletButton.addEventListener('click', () => {
        walletAddress = null;
        balances = { VIC: 0, VIN: 0 };
        vinSwapContract = null;
        vinTokenContract = null;

        walletAddressDisplay.textContent = '';
        alert('Ngắt kết nối ví thành công.');
        showConnectInterface();
    });

    // Hiển thị giao diện Swap sau khi kết nối ví
    function showSwapInterface() {
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';
    }

    // Hiển thị giao diện kết nối ban đầu
    function showConnectInterface() {
        document.getElementById('swap-interface').style.display = 'none';
        document.getElementById('connect-interface').style.display = 'block';
    }
});
