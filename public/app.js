function startLocationTracking(userId) {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            (position) => {
                fetch('/api/account/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    })
                });
            },
            (error) => console.warn("Location tracking error:", error),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }
}

function loadGameInIframe(gameContainerId, gameUrl) {
    const container = document.getElementById(gameContainerId);
    if (!container) return;
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = gameUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock allow-orientation-lock');
    iframe.setAttribute('allow', 'camera; microphone; geolocation; autoplay; fullscreen');

    container.appendChild(iframe);
}

async function handleWithdrawalSubmit(event, formElement) {
    event.preventDefault();
    const formData = new FormData(formElement);

    try {
        const res = await fetch('/api/withdrawals', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            alert("উত্তোলন সফলভাবে প্রসেস করা হয়েছে!");
            formElement.reset();
        } else {
            alert("ত্রুটি: " + data.error);
        }
    } catch (err) {
        alert("সার্ভার ত্রুটি, আবার চেষ্টা করুন।");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    startLocationTracking(1);
});
