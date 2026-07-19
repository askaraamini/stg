export interface SubjectMeta {
  imageUrl: string;
  gradient: string;
  textColor: string;
  progressColor: string;
  ringColor: string;
}

export const SUBJECT_ICONS: Record<string, SubjectMeta> = {
  "Matematika": {
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLuFEXlea7QZnfqqsxDqKtM4EY8khDbhj8JZMwRM41grEU-GS1iWpVuORf7ARNuu9hrLF2vN3_yzQA8aMW-iWJbKHjFvXbcL7SE794bbCDwS-DDKYcZ0Evli8I4Uri_FErbekIlWNVXri08FXb4DBx_PH9d5KTNDD7Aia01VHq52xulZRQy6ZpegpBwIrn-iiiyXfhR7cdoEusy1yF_XitQDQ9U-Y312268wxB_yHTnxLlIExyAnoXkvCy8",
    gradient: "from-purple-100 to-pink-100",
    textColor: "text-purple-900",
    progressColor: "bg-purple-600",
    ringColor: "#fdc003",
  },
  "IPA (Sains)": {
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLu4NNRmHMFh-k2JeoEbca9QYMBkyBXLCOjM94_1LNiU6-bhaZtHokBYsBI7w8d0fl9aJnQsVqvWbSnKIRZ1ZAsi0szLIUaPBZUA-Tut39SCn1ntdQ624SfQp0DiFF6vGFtVMqhdLxVV5SWqlJRlFcqXObzcpMAPwezmfQhheQKBm1laQHkIkUg3kF51zoh9rCikrlJTGNsqpdnPYampRtdzmMCIdg4aRG6B1JQZV1-S0y2yAVKGwOGNIR8",
    gradient: "from-blue-100 to-teal-100",
    textColor: "text-blue-900",
    progressColor: "bg-teal-600",
    ringColor: "#005da7",
  },
  "IPS (Sejarah)": {
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvb85G9gdKs23_tvv9KAtuHIdXbPWq2LXqge8Z8sUgMdM3JBwi7kcRTUdnb7H1dbWmP2QO-iKsTJHnJltXb5GZnJWOSTu0ieDTJelfKZ7IWn46WFofNHx7H6bX71Npvw9LWaiB-SUnMFfmeNw2oDiK_G-_DTVt_aOXEPPXEW3ysgrnSGHjcg2Ugfs_jK4Q7ch-67si1k-SiL8OZtYb1gILtd4m17-1gZbb28PQmEfOTFWCKHv-RHNw2V84",
    gradient: "from-orange-50 to-yellow-100",
    textColor: "text-orange-900",
    progressColor: "bg-orange-500",
    ringColor: "#785900",
  },
  "Bahasa Inggris": {
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLucyxPev4_50bTNe0CBGeKd_IAfq94zULHMjjtjfp9qaliIPQOe61or0MKi6elOAs-WRcF6hCRbSOOZFcbZSyxXzohSmBU_F5W3FuzHwOobqtIe4n9sAcit0vniLx81NSd4eGXMMLiLDbJa0gUd46KDP3pf89o7eX06zed_VTtWmqLVTSOQRdAK_cWFL6vsp-zbdcX8fMUmfotMMm0bsF7cbTBhO4rtbrxIFOvtbPmcu1uCRBsupN0AQI0",
    gradient: "from-indigo-100 to-blue-100",
    textColor: "text-indigo-900",
    progressColor: "bg-indigo-600",
    ringColor: "#005da7",
  },
  "Bahasa Indonesia": {
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLuYR9MueuybflU23Nhnj7Vr2XHXaFvthXsAtE_g7HCfkxEWmg_xb27QsvOZuFD-vhNyZko2A63lVmBsDT_NqLzU7IJrNGTxAqqt13WlIts_jKYk1qSExav9F83fjIBG2CkJjQoFfNfXDOAfnUuko7KxkETZpS4nfYmfsbcyTENN2e-bGMEknX3VhGwoTNqWRx_pnVaPdyfYBonFcp8u7pdpmFM8lbM9u65CfzcmvftfUc1nxHBwPAjfu04",
    gradient: "from-red-50 to-orange-100",
    textColor: "text-red-900",
    progressColor: "bg-red-600",
    ringColor: "#ba1a1a",
  },
  "Seni & Budaya": {
    imageUrl: "https://lh3.googleusercontent.com/aida/AP1WRLvmpqYEjcWtx6oWpxXmyaSapAdIwl1kFzqdIlLA4LC7JidBHDXbwU2EcMwbNzpO0ineidgUVnNimbOrWF2on6PLxYgtVIkmYG5SVwdwAxdJPhNEXjyjkt_k3D6IqFqWFNmX23RptT7cuiPr3Scz-x5h3zZgyz56VWPb3JRWN7KWqep3GwSjSKAk3ibh7Fq837TUpYv7qgh2R3-VmMtKQNZZV9dPbtXvac-6jb6d-ZAu3xjtkkf4ec0RzA",
    gradient: "from-emerald-100 to-green-100",
    textColor: "text-emerald-900",
    progressColor: "bg-emerald-600",
    ringColor: "#0060ac",
  },
};

export const SUBJECT_ORDER = [
  "Matematika",
  "IPA (Sains)",
  "IPS (Sejarah)",
  "Bahasa Inggris",
  "Bahasa Indonesia",
  "Seni & Budaya",
];

export const SUBJECT_HERO_GRADIENTS: Record<string, string> = {
  "Matematika": "from-purple-600 to-indigo-600",
  "IPA (Sains)": "from-blue-600 to-teal-600",
  "IPS (Sejarah)": "from-orange-600 to-yellow-600",
  "Bahasa Inggris": "from-indigo-600 to-blue-600",
  "Bahasa Indonesia": "from-red-600 to-orange-600",
  "Seni & Budaya": "from-emerald-600 to-green-600",
};

export const SUBJECT_IMAGE_FILE: Record<string, string> = {
  "Matematika": "/images/Matematika.png",
  "IPA (Sains)": "/images/IPA.png",
  "IPS (Sejarah)": "/images/IPS.png",
  "Bahasa Inggris": "/images/Bahasa inggris.png",
  "Bahasa Indonesia": "/images/Bahasa Indonesia.png",
  "Seni & Budaya": "/images/Seni & Budaya.png",
};
