// Kiểm tra nếu trình duyệt hỗ trợ MetaMask
if (typeof window.ethereum === "undefined") {
    alert("Vui lòng cài đặt MetaMask để sử dụng VinSwap!");
}

// Biến toàn cục
let provider, signer, userAccount;
let vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // Địa chỉ token VIN
let vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38"; // Địa chỉ hợp đồng Swap

// Khởi tạo kết nối ví MetaMask
async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert("Vui lòng cài đặt MetaMask!");
            return;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAccount = await signer.getAddress();

        console.log("✅ Đã kết nối ví:", userAccount);
        document.getElementById("wallet-address").innerText = userAccount;

        // Ẩn nút Connect Wallet và hiển thị giao diện Swap
        document.querySelector(".main-content").style.display = "none";
        document.getElementById("swap-interface").style.display = "block";

        // Gọi hàm hiển thị số dư sau khi kết nối
        getBalances();
    } catch (error) {
        console.error("❌ Lỗi kết nối ví:", error);
        alert("Kết nối ví thất bại!");
    }
}

// Hàm lấy số dư VIC & VIN của người dùng
async function getBalances() {
    try {
        if (!userAccount) {
            console.error("Ví chưa được kết nối!");
            return;
        }

        console.log("🔍 Kiểm tra số dư của ví:", userAccount);

        // 🏦 Lấy số dư VIC (Native Coin - Viction)
        const vicBalanceRaw = await provider.getBalance(userAccount);
        const vicBalance = ethers.utils.formatEther(vicBalanceRaw);
        document.getElementById("from-balance").innerText = `${vicBalance} VIC`;

        // 🏦 Lấy số dư VIN (Token ERC-20)
        const vinTokenContract = new ethers.Contract(vinTokenAddress, [
            { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
        ], provider);
        const vinBalanceRaw = await vinTokenContract.balanceOf(userAccount);
        const vinBalance = ethers.utils.formatUnits(vinBalanceRaw, 18);
        document.getElementById("to-balance").innerText = `${vinBalance} VIN`;

        console.log(`✅ Số dư VIC: ${vicBalance} VIC`);
        console.log(`✅ Số dư VIN: ${vinBalance} VIN`);
    } catch (error) {
        console.error("❌ Lỗi khi lấy số dư:", error);
    }
}

// Gán sự kiện cho nút kết nối
document.getElementById("connect-wallet").addEventListener("click", connectWallet);
