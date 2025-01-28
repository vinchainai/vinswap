const fs = require('fs');
const fetch = require('node-fetch');

async function updateVinPrice() {
    const RATE = 0.039; // VIN to BNB (tỷ lệ cố định)
    const bnbPriceUrl = 'https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=BIEGUCY7A9NPF2M2KPYZRMRFABVCVJ9D3V';

    try {
        // Fetch giá BNB/USD từ API BscScan
        const response = await fetch(bnbPriceUrl);
        const data = await response.json();
        const bnbToUsd = parseFloat(data.result.ethusd);

        // Tính giá VIN/USD
        const vinToUsd = (RATE * bnbToUsd).toFixed(2);

        // JSON data để ghi vào file vin-price.json
        const jsonData = {
            vin_to_bnb: RATE,
            bnb_to_usd: bnbToUsd,
            vin_to_usd: vinToUsd
        };

        // Ghi dữ liệu vào file vin-price.json
        fs.writeFileSync('vin-price.json', JSON.stringify(jsonData, null, 2));
        console.log('VIN price updated:', jsonData);
    } catch (error) {
        console.error('Error updating VIN price:', error);
    }
}

// Chạy script
updateVinPrice()
