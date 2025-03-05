// Biến toàn cục
let provider, signer, userAccount;
let vinTokenAddress = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4"; // Địa chỉ token VIN
let vinSwapAddress = "0xFFE8C8E49f065b083ce3F45014b443Cb6c5F6e38"; // Địa chỉ hợp đồng Swap
let rpcUrl = "https://rpc.viction.xyz"; // RPC mạng Viction

let fromToken = "VIC";
let toToken = "VIN";
const balances = { VIC: 0, VIN: 0 }; // Lưu số dư để cập nhật chính xác

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

    // Hoán đổi số dư token
    [balances.VIC, balances.VIN] = [balances.VIN, balances.VIC];

    // Cập nhật số dư hiển thị
    document.getElementById("from-balance").textContent = `${balances[fromToken]} ${fromToken}`;
    document.getElementById("to-balance").textContent = `${balances[toToken]} ${toToken}`;
});

// 🏦 Hàm lấy số dư VIC & VIN chính xác
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
        const vicBalance = ethers.utils.formatEther(vicBalanceRaw);
        balances.VIC = vicBalance; // Lưu số dư VIC
        document.getElementById("from-balance").textContent = `${balances.VIC} VIC`;

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
        const vinBalance = ethers.utils.formatUnits(vinBalanceRaw, 18);
        balances.VIN = vinBalance; // Lưu số dư VIN
        document.getElementById("to-balance").textContent = `${balances.VIN} VIN`;

        console.log(`✅ Số dư VIC: ${balances.VIC} VIC`);
        console.log(`✅ Số dư VIN: ${balances.VIN} VIN`);
    } catch (error) {
        console.error("❌ Lỗi khi lấy số dư VIC hoặc VIN:", error);
    }
}
