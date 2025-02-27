// 📌 Khai báo các biến cần thiết
let provider, signer, walletConnectProvider;
let vinSwapContract, vinTokenContract;
let walletAddress = null;
let balances = { VIC: 0, VIN: 0 };

// 📌 Địa chỉ hợp đồng thông minh VIN Swap & VIN Token
const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38";
const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

// 🔌 Khởi tạo kết nối blockchain
const RPC_URL = "https://rpc.viction.xyz";
provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// 📌 ABI của hợp đồng VIN Token
const vinABI = [
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// 📌 Kết nối hợp đồng thông minh VIN Token
vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, provider);

// 🔄 Kết nối ví MetaMask hoặc WalletConnect
async function connectWallet() {
    try {
        if (window.ethereum) {
            // 🦊 Nếu trình duyệt có MetaMask, kết nối bình thường
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
        } else {
            // 📱 Nếu không có MetaMask, dùng WalletConnect
            walletConnectProvider = new WalletConnectProvider.default({
                rpc: {
                    88: RPC_URL // ✅ Chain ID 88 (Viction Mainnet)
                },
                chainId: 88,
                qrcode: true // Hiển thị mã QR để quét
            });

            await walletConnectProvider.enable();
            provider = new ethers.providers.Web3Provider(walletConnectProvider);
        }

        // 🔌 Lấy thông tin signer từ provider
        signer = provider.getSigner();
        walletAddress = await signer.getAddress();

        console.log(`🔗 Ví đã kết nối: ${walletAddress}`);

        // 🎉 Hiển thị địa chỉ ví lên giao diện
        document.getElementById("wallet-address").textContent = `Connected: ${walletAddress}`;

        // 🔄 Cập nhật số dư
        await updateBalances();

        // 📌 Ẩn giao diện kết nối, hiển thị giao diện Swap
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';

    } catch (error) {
        console.error("❌ Lỗi khi kết nối ví:", error);
        alert("⚠️ Failed to connect wallet. Please try again!");
    }
}

// 🔄 Hàm cập nhật số dư VIC & VIN
async function updateBalances() {
    try {
        if (!walletAddress) {
            throw new Error("❌ Ví chưa kết nối!");
        }

        console.log(`🔍 Đang lấy số dư cho ví: ${walletAddress}`);

        // 🏦 Lấy số dư VIC (Native Coin)
        const vicBalanceRaw = await provider.getBalance(walletAddress);
        balances.VIC = parseFloat(ethers.utils.formatEther(vicBalanceRaw));

        console.log(`✅ Số dư VIC: ${balances.VIC}`);

        // 🏦 Lấy số dư VIN (Token ERC-20)
        const vinTokenWithSigner = vinTokenContract.connect(signer);
        const vinBalanceRaw = await vinTokenWithSigner.balanceOf(walletAddress);
        balances.VIN = parseFloat(ethers.utils.formatUnits(vinBalanceRaw, 18));

        console.log(`✅ Số dư VIN: ${balances.VIN}`);

        // 📌 Hiển thị số dư lên giao diện
        document.getElementById("from-token-info").textContent = `VIC: ${balances.VIC.toFixed(4)}`;
        document.getElementById("to-token-info").textContent = `VIN: ${balances.VIN.toFixed(4)}`;

    } catch (error) {
        console.error("❌ Lỗi khi lấy số dư:", error);
        alert("⚠️ Failed to fetch balances. Please check Console (F12)!");
    }
}

// 🖱️ Khi bấm "Connect Wallet"
document.getElementById("connect-wallet").addEventListener("click", connectWallet);

// 🔌 Ngắt kết nối ví
async function disconnectWallet() {
    try {
        walletAddress = null;
        balances = { VIC: 0, VIN: 0 };

        // 📌 Cập nhật giao diện
        document.getElementById("wallet-address").textContent = '';
        document.getElementById("from-token-info").textContent = "VIC: 0.0000";
        document.getElementById("to-token-info").textContent = "VIN: 0.0000";

        // 📌 Hiển thị lại giao diện kết nối
        document.getElementById('swap-interface').style.display = 'none';
        document.getElementById('connect-interface').style.display = 'block';

        alert("✅ Wallet disconnected successfully.");
    } catch (error) {
        console.error("❌ Error disconnecting wallet:", error);
        alert("⚠️ Failed to disconnect wallet. Please try again.");
    }
}

// 🖱️ Khi bấm "Disconnect Wallet"
document.getElementById("disconnect-wallet").addEventListener("click", disconnectWallet);
