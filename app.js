// Kiểm tra nếu trình duyệt hỗ trợ MetaMask
if (typeof window.ethereum === "undefined") {
    alert("Vui lòng cài đặt MetaMask để sử dụng VinSwap!");
}

// 📌 Biến toàn cục
let provider, signer, userAccount;
let vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // Địa chỉ token VIN
let vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38"; // Địa chỉ hợp đồng Swap
let rpcUrl = "https://rpc.viction.xyz"; // RPC mạng Viction

let fromToken = "VIC";
let toToken = "VIN";
const balances = { VIC: 0, VIN: 0 }; // Lưu số dư VIC/VIN chính xác

// 📌 Kết nối ví MetaMask
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

        // Ẩn các giao diện không cần thiết
        document.querySelector(".main-content").style.display = "none";
        document.querySelector(".navbar").style.display = "none";
        document.querySelector(".footer").style.display = "none";

        // Hiển thị giao diện Swap
        document.getElementById("swap-interface").style.display = "block";

        // Gọi hàm hiển thị số dư sau khi kết nối
        await getBalances();
    } catch (error) {
        console.error("❌ Lỗi kết nối ví:", error);
        alert("Kết nối ví thất bại!");
    }
}

// 📌 Lấy số dư VIC & VIN
async function getBalances() {
    try {
        if (!userAccount) {
            console.error("Ví chưa được kết nối!");
            return;
        }

        console.log("🔍 Kiểm tra số dư của ví:", userAccount);

        // 🏦 Lấy số dư VIC (Native Coin - Viction)
        const vicProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const vicBalanceRaw = await vicProvider.getBalance(userAccount);
        balances.VIC = ethers.utils.formatEther(vicBalanceRaw); // Lưu số dư VIC

        // 🏦 Lấy số dư VIN (Token ERC-20)
        const vinABI = [
            {
                "constant": true,
                "inputs": [{ "name": "owner", "type": "address" }],
                "name": "balanceOf",
                "outputs": [{ "name": "balance", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        const vinTokenContract = new ethers.Contract(vinTokenAddress, vinABI, vicProvider);
        const vinBalanceRaw = await vinTokenContract.balanceOf(userAccount);
        balances.VIN = ethers.utils.formatUnits(vinBalanceRaw, 18); // Lưu số dư VIN

        // Hiển thị số dư đúng
        updateBalanceDisplay();

        console.log(`✅ Số dư VIC: ${balances.VIC} VIC`);
        console.log(`✅ Số dư VIN: ${balances.VIN} VIN`);
    } catch (error) {
        console.error("❌ Lỗi khi lấy số dư VIC hoặc VIN:", error);
    }
}

// 📌 Cập nhật số dư trên giao diện
function updateBalanceDisplay() {
    document.getElementById("from-balance").textContent = `${balances[fromToken]}`;
    document.getElementById("to-balance").textContent = `${balances[toToken]}`;
}

// 📌 Xử lý hoán đổi chiều swap
document.getElementById("swap-direction").addEventListener("click", async () => {
    console.log("🔄 Đảo hướng swap...");

    // Hoán đổi token
    [fromToken, toToken] = [toToken, fromToken];

    // Cập nhật giao diện token
    document.getElementById("from-token-symbol").textContent = fromToken;
    document.getElementById("to-token-symbol").textContent = toToken;
    [document.getElementById("from-token-logo").src, document.getElementById("to-token-logo").src] =
    [document.getElementById("to-token-logo").src, document.getElementById("from-token-logo").src];

    // Cập nhật lại số dư hiển thị
    updateBalanceDisplay();
});

// 📌 Gán sự kiện cho nút kết nối ví
document.getElementById("connect-wallet").addEventListener("click", connectWallet);
