import { useEffect } from "react";

export function useFacebookSDK() {
  const appId = 1958437421712750;
  useEffect(() => {
    // Nếu đã load rồi thì bỏ qua
    if (document.getElementById("facebook-jssdk")) return;

    // Gắn script SDK
    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.appendChild(js);

    // Init SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId,
        xfbml: true,
        version: "v20.0",
      });
    };
  }, [appId]);
}
