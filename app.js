// 📌 Khi trang web tải xong, thêm sự kiện vào các nút
document.addEventListener('DOMContentLoaded', async () => {
    // 🌍 Các phần tử DOM
    const connectWalletButton = document.getElementById('connect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');

    // 🔗 Cấu hình Blockchain
    let provider, signer;
    const RPC_URL = "https://rpc.viction.xyz"; // RPC mạng Viction
    const vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38"; // Hợp đồng Swap
    const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // Token VIN
    let walletAddress = null;

    // 🔗 ABI của token VIN (ERC-20)
    const vinTokenABI = [
        {
            "constant": true,
            "inputs": [{ "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
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

            // Kết nối hợp đồng VIN Token
            vinTokenContract = new ethers.Contract(vinTokenAddress, vinTokenABI, provider);

            // 📝 Hiển thị địa chỉ ví
            walletAddressDisplay.textContent = `Wallet: ${walletAddress}`;
            alert(`Connected: ${walletAddress}`);

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

            // 🏦 Lấy số dư VIC bằng Web3Provider (Đúng trên trình duyệt)
            const balanceVic = await provider.getBalance(walletAddress);
            const formattedVic = ethers.utils.formatEther(balanceVic);

            // 🏦 Lấy số dư VIN bằng signer thay vì provider
            const vinTokenContractWithSigner = new ethers.Contract(vinTokenAddress, vinTokenABI, signer);
            const balanceVin = await vinTokenContractWithSigner.balanceOf(walletAddress);
            const formattedVin = ethers.utils.formatUnits(balanceVin, 18);

            // 📝 Hiển thị số dư trên giao diện
            fromTokenInfo.textContent = `VIC: ${formattedVic}`;
            toTokenInfo.textContent = `VIN: ${formattedVin}`;
            alert(`✅ VIC Balance: ${formattedVic} VIC\n✅ VIN Balance: ${formattedVin} VIN`);
        } catch (error) {
            console.error("Error checking balances:", error);
        }
    }

    // 🎯 Kết nối ví khi nhấn nút
    connectWalletButton.addEventListener("click", connectWallet);
});
