// 🎯 Kết nối ví MetaMask và lấy số dư VIC + VIN
document.addEventListener("DOMContentLoaded", async () => {
    const connectButton = document.getElementById("connect-wallet");
    const disconnectButton = document.getElementById("disconnect-wallet");
    const homeInterface = document.getElementById("connect-interface");
    const swapInterface = document.getElementById("swap-interface");
    const walletAddressDisplay = document.getElementById("wallet-address");
    const fromTokenInfo = document.getElementById("from-token-info");
    const toTokenInfo = document.getElementById("to-token-info");

    let provider, signer, userAddress;

    // ✅ Kiểm tra nếu MetaMask đã được cài đặt
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask chưa được cài đặt! Vui lòng cài đặt MetaMask để sử dụng VinSwap.");
        return;
    }

    // 🌐 Khởi tạo provider từ MetaMask
    provider = new ethers.providers.Web3Provider(window.ethereum);

    // 📌 Kết nối ví MetaMask
    connectButton.addEventListener("click", async () => {
        try {
            const accounts = await provider.send("eth_requestAccounts", []);
            userAddress = accounts[0];

            signer = provider.getSigner();
            walletAddressDisplay.textContent = `🟢 ${userAddress}`;

            // Ẩn giao diện Home, hiển thị giao diện Swap
            homeInterface.style.display = "none";
            swapInterface.style.display = "block";

            // Gọi hàm lấy số dư VIC & VIN
            await getBalances(userAddress);
        } catch (error) {
            console.error("❌ Lỗi khi kết nối MetaMask:", error);
            alert("Không thể kết nối MetaMask. Vui lòng thử lại!");
        }
    });

    // 🔌 Ngắt kết nối và quay lại màn hình Home
    disconnectButton.addEventListener("click", () => {
        swapInterface.style.display = "none";
        homeInterface.style.display = "block";
    });

    // 🔄 Hàm lấy số dư VIC & VIN
    async function getBalances(address) {
        try {
            // 🏦 Lấy số dư VIC (Native Coin)
            const vicBalanceRaw = await provider.getBalance(address);
            const vicBalance = ethers.utils.formatEther(vicBalanceRaw);
            fromTokenInfo.textContent = `VIC: ${parseFloat(vicBalance).toFixed(4)}`;

            // 🏦 Lấy số dư VIN (ERC-20)
            const vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";  // Địa chỉ VIN trên VIC
            const vinABI = [{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"uint8","name":"_decimals","type":"uint8"},{"internalType":"uint256","name":"_initialSupply","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"address","name":"issuer","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Fee","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"FeeUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"value","type":"uint256"}],"name":"estimateFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"issuer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"fee","type":"uint256"}],"name":"setFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];

            // 🛠 Sử dụng JsonRpcProvider thay vì Web3Provider để đảm bảo kết nối đúng mạng
            const rpcProvider = new ethers.providers.JsonRpcProvider("https://rpc.viction.xyz");

            // 🌍 Kết nối hợp đồng VIN Token
            const vinContract = new ethers.Contract(vinTokenAddress, vinABI, rpcProvider);
            
            // 🔍 Lấy số dư token VIN
            const vinBalanceRaw = await vinContract.balanceOf(address);
            const vinBalance = ethers.utils.formatUnits(vinBalanceRaw, 18);
            toTokenInfo.textContent = `VIN: ${parseFloat(vinBalance).toFixed(4)}`;
        } catch (error) {
            console.error("❌ Lỗi khi lấy số dư VIN:", error);
            alert("Không thể lấy số dư VIN. Kiểm tra console để biết thêm chi tiết.");
        }
    }
});
