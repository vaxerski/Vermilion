<script lang="ts">
    let color = $state("#00b30033");
    let text = $state("");
    let positionFromBottom = $state(-10);
    let lastNotif = 0;

    window.electronAPI.newNotification((res) => {
        color = res.color;
        text = res.text;
        positionFromBottom = 7;
        lastNotif = Date.now();
    });

    setInterval(() => {
        if (Date.now() - 2500 > lastNotif)
            positionFromBottom = -10;
    }, 500);
</script>

<div class="notification-container" style="background: linear-gradient(125deg, #22222233 0%, {color} 100%); bottom:{positionFromBottom}rem;">
    <p class="notification-text">
        {text}
    </p>
</div>

<style>
    .notification-container {
        position: absolute;
        display: block;
        transition: 0.2s cubic-bezier(0.215, 0.610, 0.355, 1);
        height: 3rem;
        width: 25rem;
        border-radius: 0.6rem;
        z-index: 90;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: 0 0 1rem black;
        backdrop-filter: saturate(150%) blur(50px);
    }

    .notification-text {
        font-family: var(--vm-panel-font-regular);
        color: var(--vm-panel-font-base);
        position: absolute;
        top:50%;
        left: 50%;
        max-width: 100%;
        width: 100%;
        text-align: center;
        overflow: hidden;
        text-wrap: nowrap;
        text-overflow: ellipsis;
        transform: translateX(-50%) translateY(-50%);
        font-size: 0.8rem;
        opacity: 0.9;
    }
</style>