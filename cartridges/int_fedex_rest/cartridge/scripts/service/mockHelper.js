/**
 * Fedex Auth Mock
 * @returns {Object} - JSON Mock Response for Fedex Auth
 */
const fedexAuthMock = {
    access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJDWFMiXSwiUGF5bG9hZCI6eyJjbGllbnRJZGVudGl0eSI6eyJjbGllbnRLZXkiOiJsNzllNjQ3ODcyM2E5ZTQ1ODM4MDJiYTJjN2U2ZGRjNzRkIn0sImF1dGhlbnRpY2F0aW9uUmVhbG0iOiJDTUFDIiwiYWRkaXRpb25hbElkZW50aXR5Ijp7InRpbWVTdGFtcCI6IjA2LUp1bi0yMDIzIDA4OjA5OjI1IEVTVCIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJhcGltb2RlIjoiU2FuZGJveCIsImN4c0lzcyI6Imh0dHBzOi8vY3hzYXV0aHNlcnZlci1zdGFnaW5nLmFwcC5wYWFzLmZlZGV4LmNvbS90b2tlbi9vYXV0aDIifSwicGVyc29uYVR5cGUiOiJEaXJlY3RJbnRlZ3JhdG9yX0IyQiJ9LCJleHAiOjE2ODYwNjA1NjUsImp0aSI6ImFlMDJkMmIzLTdjMWYtNGE1NC04NjY4LWZhNzg2ZjYxMmQ2MCJ9.STsVoo1otK76HTBbh2PH8XMYbkJ0GilOULR6fl10M8XO1DqeHBDdhuvQS3vAXvbiZ44jQc91jJybJQznn6hRHAa-YtpJQ7n4oORUMmi2iuPosL_V0CbRjnqsbRHl_XVyqhy3hKMtHPwHe7eZKxNMFU-snkNb6UJm73bX4NYlMkLJlD8G4mvNKVb0qF6AmHy3RJ9X6IaK-v5VUFSzkiZFR73dt1WBcAmWiNK_Ux6vWHzmy0sAxW-k1ZD0vp4d-x6aja_Vbehgk7nMpv5GYLxm3bvf4Ok24Oy7OHmUfFJTzGrtywXCfz3VLY5hWm7tHXSailo7iS_cdkJEMpvKqEAP0SZoJ0ROVAqccSzItAyqrfIdjp3bVjLtyZoyvF8E3YCjDAeExTvm94YVGvUvmipUokQuDysffqWtrinrth66XQfiaoVfQdH0tUyYMnVESzVpGkUTIWmVaUm4VcUOKfa2pJjc47T-dDKCbVmDbqogsI0-GgPo3f3qtqPHUtXe2ne3ssh7HDQpIZTCCOHrwAcMH0IKjFhcNuY33coAT6prAuXocJLMKBszMSVLPFH651BWVv5WfV09Fqlr2AJpL2xlrbkcSAzGgLOs6jVjMg7M2Pkod-tnBD0Ewr5cSTRKEmWWyugV07torzgBVOb-yYPaxMJrlJXHMOY6KPYOYZrbgoY',
    token_type: 'bearer',
    expires_in: 3599,
    scope: 'CXS'
};

/**
 * Fedex Label Mock
 * @returns {Object} - JSON Mock Response for Fedex Label
 */
const fedexLabelMock = {
    transactionId: '1b60b82a-375c-48f3-8740-76036a20e0f1',
    output: {
        transactionShipments: [
            {
                masterTrackingNumber: '794636692361',
                serviceType: 'INTERNATIONAL_ECONOMY',
                shipDatestamp: '2023-06-06',
                serviceName: 'FedEx International Economy®',
                pieceResponses: [
                    {
                        masterTrackingNumber: '794636692361',
                        trackingNumber: '794636692361',
                        additionalChargesDiscount: 0,
                        netRateAmount: 74.21,
                        netChargeAmount: 0,
                        netDiscountAmount: 0,
                        packageDocuments: [
                            {
                                contentType: 'LABEL',
                                copiesToPrint: 1,
                                encodedLabel: 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL091dGxpbmVzCi9Db3VudCAwCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovQ291bnQgNQovS2lkcyBbMTggMCBSIDE5IDAgUiAyMCAwIFIgMjEgMCBSIDIyIDAgUl0KPj4KZW5kb2JqCjQgMCBvYmoKWy9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDIC9JbWFnZUldCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQovRW5jb2RpbmcgL01hY1JvbWFuRW5jb2RpbmcKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQKL0VuY29kaW5nIC9NYWNSb21hbkVuY29kaW5nCj4+CmVuZG9iago3IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYS1PYmxpcXVlCi9FbmNvZGluZyAvTWFjUm9tYW5FbmNvZGluZwo+PgplbmRvYmoKOCAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZE9ibGlxdWUKL0VuY29kaW5nIC9NYWNSb21hbkVuY29kaW5nCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0NvdXJpZXIKL0VuY29kaW5nIC9NYWNSb21hbkVuY29kaW5nCj4+CmVuZG9iagoxMCAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9Db3VyaWVyLUJvbGQKL0VuY29kaW5nIC9NYWNSb21hbkVuY29kaW5nCj4+CmVuZG9iagoxMSAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9Db3VyaWVyLU9ibGlxdWUKL0VuY29kaW5nIC9NYWNSb21hbkVuY29kaW5nCj4+CmVuZG9iagoxMiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9Db3VyaWVyLUJvbGRPYmxpcXVlCi9FbmNvZGluZyAvTWFjUm9tYW5FbmNvZGluZwo+PgplbmRvYmoKMTMgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvVGltZXMtUm9tYW4KL0VuY29kaW5nIC9NYWNSb21hbkVuY29kaW5nCj4+CmVuZG9iagoxNCAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9UaW1lcy1Cb2xkCi9FbmNvZGluZyAvTWFjUm9tYW5FbmNvZGluZwo+PgplbmRvYmoKMTUgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvVGltZXMtSXRhbGljCi9FbmNvZGluZyAvTWFjUm9tYW5FbmNvZGluZwo+PgplbmRvYmoKMTYgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvVGltZXMtQm9sZEl0YWxpYwovRW5jb2RpbmcgL01hY1JvbWFuRW5jb2RpbmcKPj4KZW5kb2JqCjE3IDAgb2JqIAo8PAovQ3JlYXRpb25EYXRlIChEOjIwMDMpCi9Qcm9kdWNlciAoRmVkRXggU2VydmljZXMpCi9UaXRsZSAoRmVkRXggU2hpcHBpbmcgTGFiZWwpDS9DcmVhdG9yIChGZWRFeCBDdXN0b21lciBBdXRvbWF0aW9uKQ0vQXV0aG9yIChDTFMgVmVyc2lvbiA1MTIwMTM1KQo+PgplbmRvYmoKMTggMCBvYmoKPDwKL1R5cGUgL1BhZ2UNL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8IC9Qcm9jU2V0IDQgMCBSIAogL0ZvbnQgPDwgL0YxIDUgMCBSIAovRjIgNiAwIFIgCi9GMyA3IDAgUiAKL0Y0IDggMCBSIAovRjUgOSAwIFIgCi9GNiAxMCAwIFIgCi9GNyAxMSAwIFIgCi9GOCAxMiAwIFIgCi9GOSAxMyAwIFIgCi9GMTAgMTQgMCBSIAovRjExIDE1IDAgUiAKL0YxMiAxNiAwIFIgCiA+PgovWE9iamVjdCA8PCAvRmVkRXhFeHByZXNzIDI1IDAgUgovRXhwcmVzc0UgMjYgMCBSCi9iYXJjb2RlMCAyNyAwIFIKL0ZlZEV4RXhwcmVzcyAyOCAwIFIKL0V4cHJlc3NFIDI5IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovVHJpbUJveFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDIzIDAgUgovUm90YXRlIDA+PgplbmRvYmoKMTkgMCBvYmoKPDwKL1R5cGUgL1BhZ2UNL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8IC9Qcm9jU2V0IDQgMCBSIAogL0ZvbnQgPDwgL0YxIDUgMCBSIAovRjIgNiAwIFIgCi9GMyA3IDAgUiAKL0Y0IDggMCBSIAovRjUgOSAwIFIgCi9GNiAxMCAwIFIgCi9GNyAxMSAwIFIgCi9GOCAxMiAwIFIgCi9GOSAxMyAwIFIgCi9GMTAgMTQgMCBSIAovRjExIDE1IDAgUiAKL0YxMiAxNiAwIFIgCiA+PgovWE9iamVjdCA8PCAvRmVkRXhFeHByZXNzIDI1IDAgUgovRXhwcmVzc0UgMjYgMCBSCi9iYXJjb2RlMCAyNyAwIFIKL0ZlZEV4RXhwcmVzcyAyOCAwIFIKL0V4cHJlc3NFIDI5IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovVHJpbUJveFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDI0IDAgUgovUm90YXRlIDA+PgplbmRvYmoKMjAgMCBvYmoKPDwKL1R5cGUgL1BhZ2UNL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8IC9Qcm9jU2V0IDQgMCBSIAogL0ZvbnQgPDwgL0YxIDUgMCBSIAovRjIgNiAwIFIgCi9GMyA3IDAgUiAKL0Y0IDggMCBSIAovRjUgOSAwIFIgCi9GNiAxMCAwIFIgCi9GNyAxMSAwIFIgCi9GOCAxMiAwIFIgCi9GOSAxMyAwIFIgCi9GMTAgMTQgMCBSIAovRjExIDE1IDAgUiAKL0YxMiAxNiAwIFIgCiA+PgovWE9iamVjdCA8PCAvRmVkRXhFeHByZXNzIDI1IDAgUgovRXhwcmVzc0UgMjYgMCBSCi9iYXJjb2RlMCAyNyAwIFIKL0ZlZEV4RXhwcmVzcyAyOCAwIFIKL0V4cHJlc3NFIDI5IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovVHJpbUJveFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDI0IDAgUgovUm90YXRlIDA+PgplbmRvYmoKMjEgMCBvYmoKPDwKL1R5cGUgL1BhZ2UNL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8IC9Qcm9jU2V0IDQgMCBSIAogL0ZvbnQgPDwgL0YxIDUgMCBSIAovRjIgNiAwIFIgCi9GMyA3IDAgUiAKL0Y0IDggMCBSIAovRjUgOSAwIFIgCi9GNiAxMCAwIFIgCi9GNyAxMSAwIFIgCi9GOCAxMiAwIFIgCi9GOSAxMyAwIFIgCi9GMTAgMTQgMCBSIAovRjExIDE1IDAgUiAKL0YxMiAxNiAwIFIgCiA+PgovWE9iamVjdCA8PCAvRmVkRXhFeHByZXNzIDI1IDAgUgovRXhwcmVzc0UgMjYgMCBSCi9iYXJjb2RlMCAyNyAwIFIKL0ZlZEV4RXhwcmVzcyAyOCAwIFIKL0V4cHJlc3NFIDI5IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovVHJpbUJveFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDI0IDAgUgovUm90YXRlIDA+PgplbmRvYmoKMjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2UNL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8IC9Qcm9jU2V0IDQgMCBSIAogL0ZvbnQgPDwgL0YxIDUgMCBSIAovRjIgNiAwIFIgCi9GMyA3IDAgUiAKL0Y0IDggMCBSIAovRjUgOSAwIFIgCi9GNiAxMCAwIFIgCi9GNyAxMSAwIFIgCi9GOCAxMiAwIFIgCi9GOSAxMyAwIFIgCi9GMTAgMTQgMCBSIAovRjExIDE1IDAgUiAKL0YxMiAxNiAwIFIgCiA+PgovWE9iamVjdCA8PCAvRmVkRXhFeHByZXNzIDI1IDAgUgovRXhwcmVzc0UgMjYgMCBSCi9iYXJjb2RlMCAyNyAwIFIKL0ZlZEV4RXhwcmVzcyAyOCAwIFIKL0V4cHJlc3NFIDI5IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovVHJpbUJveFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDI0IDAgUgovUm90YXRlIDA+PgplbmRvYmoKMjMgMCBvYmoKPDwgL0xlbmd0aCAyNTY4Ci9GaWx0ZXIgWy9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZV0gCj4+CnN0cmVhbQpHYXQ9Lj8mcjQhJlViSlJzJDM1MU0sQFdEMUU6bD05dFFTJWxZKi0mPGgjYUk/Sjw+Ry11LFEjY21JdFttaWVbRGVtO1pEVUBiWmw+Yi0zTwozTGd1NE9DQzoqQm1ianVjNUAsN0NII29xaEApSSdaMWQlITBpaSFOPE0pSy5YcWs5VWosRCtLYDUxSUFLOSdcYU5WaSE2SkdkZWYtM0BaSApQJnAhLzFLYiw+aTlMTk5EVCNnJCg5Y1U2KCJENDIkU1VmN15QK0VNLi9ZQWNHcDpyR3A7LEgqJEljaFxMSko8TmMsN2ZuXWlsdXVsU2hHSgpwUSZQPERcKWtNWDpKWkpBL1tlVTFHUkhhKkQqZHViWC1SLFNKJSQ5aUZeKERDby9vPzpzYGAsL11bY1duYClSX2MmXmFHVmpTS1plUmA0Mwo1W3AvTixgRUJ1bShgR0hBMGgiNiVdPnBZYz9TNiUraEQzQUJaM0dcJEBoMkU1Q1tPT0k8cEJnSUpEZFdpSmteRVsvMDRIRiNsTlFCNUF1PAplalkySjNnYzJmJ0FcLTlwNVNvWSckR3BOKDRlSWs+Jz1sUXByJTBhclZmXClISylIbFNPNmlELC9sQm44NCMvMidXXnAqQDdpPEArWiw7KgpXdURVNyowcDFBTFVPOkYlI2sjRCV1WVltSypPIydSSW5uUyIlPSNzJzAyJzhSQCFQIzE/NDFSPT1CKzcuPSkvaDRwUGtjSTw+WyJTJSc9XQotUT1SVCIqWFojayctXldHSUxlIV02XE9Ab2wsJi4pMyokcjk2Tl0pWk9GdVQyRSNNMyxAXCNEQG1UQyJJSVsmaT9LWCc3NERuNmRdaXNqbQpHKXVPRFc1Y1VoRmFga2teVjc4N0N0L0ZHK3UxKGNmYnU7OURCOkg/MGs5aW5HMihQYnFlKj1pLjFmaC5Wb00+V0dCSSY3cUk4cFpqVS5KSApxN00wZ11ZPmNAaUErOmVrMDBsOm5xVj9rYXRyYCdqSSo8TyQ6UDthLy50W0lvcXI6T1RdXEYwbUZSLTZyViMyOjtFKWxUQzoyaUlwTVJOaQo6cyRVLUE8XykkMDQsZE8lZ1RMRj9FSDBPUSEzUylHJz9ic0I3S2FKNj80LSxHZEgvPD8qLztJSGFVT2FBPTFaYlxoOD5gQCQsbGVXK1xyNwpUZ2xhPWBOdDJ0cFpGMjwpT0thLHA7OWQmLTpuWk1aYWwvKTZINyUvOjVSXVo7MHF0OiwlNHNkbW50P0IsOk5rLDtLZ2hoLGstLyw5bFlJTwpxWCdfUFA2JmVMSj1KOlFfNEwkV1MmaVxHQHFfXEZYNz1NdU48Vz4qKVBEaDErRTJkVlombiIzJWd1Ni4sSnNfXDojOFU3XzAwOytPZjInXgo1Yy1MRXJxIitnaVBpWi1UcDI/TCkjNykoTSdnSlI5MSpGdWZUYkNVJVpOZyVVXCYkZD1cOGxzcC1VUzlYcl5iPSdzOHVCRGEidDFyTUVITgphJ11AY0tJVTYpbk43PUc6REJjLls2U0NXO2lVKVhfRS1rQiMnUmkmJ0pdMkcncz8jLVczbnU2QmFkMmdOZVVBaWxeVWg2XzUuOWdkLjhPLgoyMipNYlk3TUkwYSE+RjdTMVVBJlUscE83M09hPkBJIzNUOkRsP1g+Y0ZLU21QOG1ZITdqYkptMmxMX2U2QVdEOVosVWlNQW9CI2gpLjcpWAowXi1fVEFyJmJgYyg4XUM8UFptWzE4cEZIWjlLNCQrW29qPVdXTWw0JjpJOkg+NjRzdDlzI0JsIjcyU0RfNi91ViE6KyshWi8lQDguVV9fSApMXiRVSUpARXBRImBEVmMjNTVWM2FXUGw1I15ccTxoLyNZX18hWT9aK2xqcFRfRlM8Nj9hIkVDVHVqUiQwMnBrPyVFNT07bl1nOiJFUDMlRgowTSNwRlRFJm5FJDtHTlJZKHBtPzAtN0dnLWdvXFwyNl86ImVzMzdjMGswJ047ZV8tVCg1ZyhSZnNzWCsoTkJuXCRKOSxYaVA/ZChpRiZDJgppZ1FIPyIrLnBXZ15wZXBuclo8I1tUIUZzUSNeIW0xZyNaOUJAYWYpW0VlaSIlQEIyXGs6PjJKV2RxZCNKUlVAMCtlWkJiJEdfWGo7QUhFOwpiMWphcycwZ0pNOzsrbEkiMXRDN25SOmA4M1tnLGY+TF5HcC4/b2UlO0ZpMThTcXJnQV1hIjJBImNDPEk4Omw6KVRkZDV1PDw5Xy42TEdzbgoiKjVBdDtlUTZ1USYvSzw9NGdaNjIvYWg8KVY/WSdiMnQiQ2Nvcz9OVTtEJFtpU0FNUy46Lj9QXDhUbkwxVmRsVy9rPCdoTHMiLCFlaU0lVQpdOzxCK1tzaV1AJjxebiwuQlpfWEtrJ2deQjcoK0s4aDIoMCE1IyknR2NzSlksVTBAMFdjPl49Rj9DRm1tODg1QmZRO3JnZkleWmllIUBYTAo/ZDhZYFYwcWY/a0Nbcy1tJW5IJVk3UjFEVF0rNkBUaCtpTlFgLEprO0pyLzchOFw4V01vTXFMPDw5Xy5AZSFnVHBPbi1vZnUpLDlIX2k5WwpAaCE2cCgnVU1ARzI9KkVbbz1kJTRhJWoqM2prNyNCN1JabkBZdEQ7OlkpOjtEN1kkJm0kPGZUX1ZtayhRRkwoMGMyYDNmZFpuXGcvUmckaQpkJmI5Jj5kazdcJW4+c1JuRCNzblUnPmQ2cTtJaVJeKUdWVE0zQCUxVT4/SF1KWHA/b0ghZV9RaThJUExcLCpOT2YuMk5bMGZPUClVMmpkXgojPzIwIT8pRS85OkpXMz0rKzJkNztkPHJjNzNSc3AzJEpfQSRISyRqJ1xAK19QYDdDXE83ODZRUGdVMkVFNHItLDtMViVHZDJjV3U5YjRGSAo5cWNxWGosVmAhPVAyZkdnXyxDYTxCcU9CTHQpKCcxb0hbJipMdHRcMyxjOV1ORVRdWFtfJy9kU0FnbkY0QiYrKWBsLVopNCM7KUciVTZwKwohPDRPRG5uOihobFtscHBvMi81I3FWOlVFRDJwKlhVTltdXk8hXShERUEyLVNvNGtuKm5HJC0tSiIwTDFwYyRhdDFsYzZwMm49J0IyZmtaLgpPNk1FZiw+ZHUzTzwmOE8rLXEtRlMrVnAqaFs+XFo4Yi4zRl4odUReUXBkU0EwUTlSLE5bUkJUQEE4NUkiUlY3N1lDQnBacmlhV2lKLE5CTApJVF8laD5WJkNKcjZMYUssQzZCZlJrOUddKytfNVlfMEMyamp1VXFsN2ltOiNLUiElb1I1T2pMcWEkZ0dvKkxjQGErc25cLDpvLU9zN1knago1UTEwRTdwU1pIayojUTs5S2VVXlZBTVYkKyU7IyxmQmtfMC1Rbi8uQl9wJilPKjpDYm9zaCc5fj4KZW5kc3RyZWFtCmVuZG9iagoyNCAwIG9iago8PCAvTGVuZ3RoIDI5NTAKL0ZpbHRlciBbL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlXSAKPj4Kc3RyZWFtCkdhdD0uPyQiXmgoVlhOL3M1RDJvVTI7NkJwXFRTKU4zUGBDRSEhUDtiay1YPyo3RnJMJDY3W2RZQ0Zrais8NEVEZV1PRyZXO1BrKWNJXFlvCickRWo1NVNKXmBSNSMjYSslaDR1YCk2XipEaWdsZmI3OF88J3I9VzRKaS4jdGYpLGQ+RW43ZTJWSTNlVGhwRSdLczZCWGdLKVxddDg8Z2BHCjg0JlFMS0lZP3M9Wj4pV2kwVzM/bjdGWTdpRG9YQ0VkQSYtLjNrOVI4ST4zOHAzMS4nTWtxM0s4RFddX1kpaT43RDNuckhdbVEjLGpYbiRhCk9cOCVAaUAvK3JYT18xXlw4S0AscGxURFkiaiRGXm06YEZcZFl0TCExPkJOcWQ0SEpOLD00ayErcm06J2AoSGFASiI9Z0pxcigmVGxIS049CitSOF41MSNvR1QpOjJQWjhyQm9wQmtMPVEhXktxM1VwTjtbMiNjIVcrLExvKS0/XEc5YSQ0SVE/Wiw8WkowLnQ2OWhLS2ZSU0VlVmwrXTZXClptQ1IpX0FZYDlDUHFGL2hqaFo/MXBobThZby9SNyw4ZyZrYTEhLylabTdfNUhdUFZZXjhTJztmOlJLKlI8OFBSSk8jRElmP29gJ1RZWVNwCm5SaUMuYzxPayVZL3MnS2EvI1owZTY0SWlhZjVyY2NhKkgwMTxVY3NfPiQxRSllVFZTQVRTZUFMMkc3NV9fRzdbMi9iJ08tTW1YaD41OiZvCj5sWCJob0FyV0YpUzNJcShMZ10mTUxQIiQ9KS5QUEVTXkxPQTtsbiFVcFEkUWpgISYubCFTbHJSL0BlNT44Slc4bjtuITskXF8yTFtQRGNFCmdTQ2liO0xiRVM1ZXNVUigjQmRFWzFfLEM/NSFKKDsxcFluZS4hK1pWIy4nO101J3VhQzJCMiREaU1FIXEwISMzRVBBZWo8KW1xUUk2L0JBCkIvJlVWJVMjcSw+aSE5bEZwPitZXk86R3UwJ19IPGJiOlhKViUpUFlvaHRfUlFnczpDP1gmc0lXXi9FXlNUZmNrOTNjWmsxPFomLD44RGtnClUyJ01yNHVaUy5bRUgoS2w7clVQVDZDK2JBczRmSnFcTkEzXTEnR1tnb24jIzQpMlc9O21VP2woMy0/XGEyMiZkKSJYMWJGUEJNdDtpUVFCCmBebGgsT1ZNSUI3NnJIX3ErWEFAS1YqR2lcKComW0o4ZSlWQF4paU44Uy0xZGxTa0MhUnVlMVdRbnNuNzw9Ij4nIkVaYi5VbDdwRV0/STMhClAya1U2YUVYcU4kcWs5dVwmIkZFQVA9T18mbHBPczZfb2hnVWlNS1FvMG5nMSdYOT1uRDZzPFUlaSROWyczIU8zbj8zMUdFQnFLcTdFWStRCkBscHEyXTdHLGkhPnVDYFFQWlY2Pkd0SU4tL2dDU0FpNyhoSXIlR1Y0PUsoTylQJS90R2QnLkY3MXJiQSIjIkRoPVwsRnAoRl9gY2xmLSNHCl85cEdbJUxNc0BcLXNnUzg5XkpDMWZiRzRkZF5fLXJvaDcyYElzQ0giVyEuME1qMUtDUE5cVyolYStyMCpcOiZVQHNWRihbRidfQlsnWC9aCkxXL0BFTWtnbnMpP1hrNyVnOi40Nz0oYFNBaz44LUsxM3JIViEocSltNEJkK2ZpZyZoXyczSCwzTyxlWm5UTSQkaEtaOTdnX2M9b0c8X2tWCjtCXGIiYGVWTllLPWJgInIhOjBBUnVAQGMlaS1VaFJaJy04J2UsbSNSM2hAJmBlPjYiYElsLUBgbVNuTk4nTm5rSmQjXDQ9SV87Yys1KzBpCm5DbG0tXmgrW01uUi5KN1pJKihPQD9FO3BPbVkhRk86Kk8rYTtZWCpRUSg9Ii8ycW1iMGZEP1AoIXJxcmBWRy5ZYi5TaUszTXQwTTVlIWAvCmA8dS0pUEg+JCoualEoWVtNaUNlTm0tSDJMdVNRQWZSY0lXKlxQa2NJIkVubUk5OUJsTjxgKTFMVy5FPzdlPF9kKEchRUM5dDIqSEE7NyRYCkdnWXE6Ziw+VFc6cnBQbkg9WTM5VDksQEJKSWZbQitWLEE8YCg2WGA9K2NER0BTSjI/JXVcWW5IVFVXXz0nQChqUWphL0RhMlJtYmIwOyQ7CkwuW0FOXmxYWTVNXFdQJCM4bW9rUz1xLHEzLExNPkMyZj0yaT9ELXJKLiUnaGgxaWYvaidrL0xgPEhtQyh1RSxUZkhVbkMudGU1WzAoUU9LClFtPGtURUJaIVVhPk91XjR0XFRcSmdcNHBxW3VPbkxScTFmPUpTMDo9MClcSUFSVDkhKyEyOkxVXzwhIiQ+P0UsWixWSS5bWj89XTE8ZyNwCk8sTTVENE02KFJRRChHN0tNcG1rLCFEKmBnXltNSVY5O0hXLDlJXlA8NS5QMnJtKiJVLlFHOm4+Y2EkJTJYbCohQTwlP1FeS004PzkhL206ClErKWc0b0xRNi00KHRWITtPYT1MNHRiRDI7PSJOOmBDVjtWLGJbdXJqJ2sxImMpLVZhTVxXUFpxRz1cMzFRNnVucD04KEY2YDQodDU0R1IxCj5kTWNvcE1sPDpDIls7bnBwYUVMaDxfLF5hMkpDUl9fREFbP0tKXy01NjJvPChGYGxjXEwjMGtBck4lbDYxM2NCS2tSZy9rTXAkKj1MZiEyCmlSR1BXJCR0W2ssMFNeXD87RTdgIkQ5UkBdS0tBdTVHbTNNQzxoZkw0PzFFMT5ibUgtYyxRPzlNW1otO00oWk5HXmomRGhGZjYiJT5jXkgsCmdvTXNbZzBnNlI8SXRHYGFXLyU9WFpbLGclZSVAY1FhaSQ8KDhTJUcmVSlkInFVT2pGUEhZYz5tW2I9bj1CO3BzbjNLQk5QKj5yNFg0JTolCmlRXG1TPWRaZShXKSJ1Q2cjVT5xQ2JWOW1MWy5NSmBacCMiU0FfIW9hJVJodGhUWicibSNDRTtoOkA4MEdQXzlNbDBTLF1vWjErKFA4YDROCmctdExBa05uciNMJEErSTpKOC5GXzFSWUtPQS5UUlJHNyMiYGNbVGJJKGI5UmlKYl0paDdcR2hccDJrPmxnM0A2aTFHNUhyVmgpNlZzcChPCmhjSkxbRFonWSReUTJPMzpSPyRtQixmSmZWIVtNJm5vWE05amxpVD1xN2Epa0BDOmFOcSRyX0QyTUtac2spMlpvMEJfKFkkST5kT0s5THNTCkAwSDRnUygyXGlnWk5ZWD5YcjlrV1pyYVBvXDdqK0ArbG9HW0pIS1c0OF1OP11wJTZGL2MwWHJfZjBIaTA3U1AkIydcMEdKYkFyb2BHMy0rCk88SDw1Ryc5QzklRiN0OmY7bG1nbFQuSj4tV0dIZ0d1cHFQP2xucStASi8uUy84NkssOjo1cHVyOD0pOmtBMDdya0JYZC9PYWFiO1NvLmdKCj9vKjk1Qis0ZHIvaSEtJy9EaTJrYkk3MXE5WytwPW05PyNWKkJSSEtHOkMsNGc4dCE6Qz1mTl5mQEFScWZ0a0kyVm9wbmVvLl0nSV0lYiVhCmc6Pk11IjksbytmQ0snLmptP2tEKlZpc2MydExzZWJOT2pHczBbMlU0YDJxWCN1JHUqcmdiXDhtT3VqRGJlNzQvPTxOQyFCSVIxLF1JQWFGCiJZZVkqITErUig/JGFgXjU5MyIqOF1AbkM4QUdPNV44SkJYRi5PPU8kS2lLW14rOkMjJlpvS0g2IzRwMWk4OCVvWS1RPiNhK15zZD5mP3JGCmFzZmgzWlxJTEAoRE4oUEZNXjBvJVNFZEg2JDZRUVBWZT9HRWYpPyE6RFZgI0c7Lk8zWSQ0QG5UOlwvbyo+MDBLaGphXztubVc4IS5GU15nCidMI11qJVQqMk5FNjlyS2toYEYrSTZVLVpzNS5Pa3Bdfj4KZW5kc3RyZWFtCmVuZG9iagoyNSAwIG9iago8PCAvVHlwZSAvWE9iamVjdAovU3VidHlwZSAvSW1hZ2UKL1dpZHRoIDExOAovSGVpZ2h0IDQ5Ci9Db2xvclNwYWNlIC9EZXZpY2VHcmF5Ci9CaXRzUGVyQ29tcG9uZW50IDgKL0xlbmd0aCA0NjEKL0ZpbHRlciBbL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlXQo+PnN0cmVhbQpHYiIvZUpJXVI/I1huWGtUNkE+WEtuRGJXQiJNWkVhalBwZDRdJyheQFJsdCJrQiJTMCRmJT89bT00Qzs7LiROKGpSY1lSJXNkJmw5JE90XgopJjc9TCg3LWVxcWVALigvU0M5ODQtZkxYZUxaNXFjWjVsQUVCNTU+M0AwPWsiO1JoMmhCY1FMMyZKPzVvW2NIMGJTRk5ePDs7QDQxU1k5bQpjIlpJPVlsI2M0KWBfIllsbU4zJS5BLmxOU2BWZS9ZPCU/LjcoKCkvLmRCWztrIUpbJSclREpcST8rYTc6NW9Oa1lccUVTPjM8STViWm0oSQolZDxAQik4RGJ0M3BLR2NsYlFrMSdpWlZzN05NMFxvJlIqcVU+Z0h1LUZyQ2toPGtIRkcqXCRNPV9zVi8tJFxKRjplLz8+ZlhBK0NDbXBEZQpkU1A2R2N1LFxYJ0FMPWE1SkNbNDZHLmhwMj1VNGVeJGVvXFEjYiptN0M4JC1KQShjWj9ZYCdDOzZKcEhlUGxcJEhFQyF1XipRYSs2Z0VNawpbZkVWKmIuIz5wcj4tV1NmIz5oJlc/dWtrVHNoWWA9L1guNjZBKjtiaXMvZGdAUVhYc3I4bTt+PgplbmRzdHJlYW0KZW5kb2JqCjI2IDAgb2JqCjw8IC9UeXBlIC9YT2JqZWN0Ci9TdWJ0eXBlIC9JbWFnZQovV2lkdGggNTQKL0hlaWdodCA1NAovQ29sb3JTcGFjZSAvRGV2aWNlR3JheQovQml0c1BlckNvbXBvbmVudCA4Ci9MZW5ndGggNzcKL0ZpbHRlciBbL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlXQo+PnN0cmVhbQpHYiIwSmQwVGRxJGo0b0ZeVSwiSFRzOUVJRTswQVQsX0UqTFolb0A3Smw1VjtIJ0NzPVRycURhSC40QmYjYzRPVlQ7KGQjZjxHRTl+PgplbmRzdHJlYW0KZW5kb2JqCjI3IDAgb2JqCjw8IC9UeXBlIC9YT2JqZWN0Ci9TdWJ0eXBlIC9JbWFnZQovV2lkdGggMjc3Ci9IZWlnaHQgNzYKL0NvbG9yU3BhY2UgL0RldmljZUdyYXkKL0JpdHNQZXJDb21wb25lbnQgOAovTGVuZ3RoIDE0NzIKL0ZpbHRlciBbL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlXQo+PnN0cmVhbQpHYiIvYzYnPDBZJGo2Pio6TkwibCtvdDtXWWgvOCpZb1BRIj0nJ3I8PGZsLzNnaUxla0lWUEkncypIPzlZTGU6Jm4qQjpWRy5zOjhrSSItOAo/ZjEta2gjJGUyUSlpOydKWDs7aldadXM3Sil0T008Z044SSM+Oi1Gb0U3MCYjTl8jPl1GMkRtOUlYJCJiOD42W1s7QGc5VjtoWjhLMCgmJQoqJ1I/TTVLLUY6N2dLO1cqYSpxIVo3SSleS0NVLSFAQDwub0kqIl8mWE0pY2I7K1g6PEpQUVJeUmtRT21eJS5xUUVZRjd1JjEqbjJYdStcNgpIO0cqb19iZDN1KSRULU9pS2hvZiEpcHRaRWU9VyJjdG4pQXFkV25uLnJxcWdoYHBNbEZNIVIrRURSLmZQPkUvLFBaSzVJWnBfKiFHUy9TLwptKUUjaDlQSCk+cWtfckEoYlY6Pl41XykkW0tjSmRKZyxWPiVhJ3UzPmBPWHFEbU49bE9qbiZeY0VHYm4mMGVkbDssYityTzxjI1UsWERzaQpHM1xdMi1yKUUvI05fVUAkakBfOmFzY0tLODxcP3IyIWxxb21XUVJRYm9zblM3UmdUVFVJI1s4JylhcUUiNzElcDooUEs1R25TOWRkNCo0bwo1a082XFVbJGRWaVF1NkI7bzxhMl8lbE91KVArdUhGIjFuPy4uOzttLXNeRV5LNXNlW0syUU9oZTVacCNcOT4xZ2FbUmhtXXBGbUVRYCEsMApxbFYrbk1CXCckcmpqWlYmXnA8Yi9UMEw+KjBlTDpBOklYVio6YFhEKjpZb3AuISUkbkloaFI5SDZzKDJPWFBTSnBNTSkrYFxgIjEkZUBGRApHQj9Ya2IlIjhCbGB1Km0oSXRmPVdFdT5zRkVeQ2ttOS9KZEdAPC0ha1VGZyxaJWhTIyJqJHElYkgpdXNXLlQrZSplbzpAXW9AKVg9bFtAJwo8YUY4XE9abl9JIjlpJGFKQCdgPCxXKyV1Q0ZIPzJhJ0U0SGFyY2sjbmU7ZDBwJjdoZVtHMmFAO2pZNkpjO0tmXUktcTF0SlQuSF1uVFRlPApRO3E+TSVpKyZUcXFtZWojTl9XVilPMGFXKi9rJCZhbS1DOj4odC5UYGhWcT81YSNbJyVUO1dORV1QSWwwO006KzJFJV1hI2ZRXnBFX21nMQppYDkqWFlCZz4paUctYm5cJEhyX1hkLE9vUVAvTmErI01fVFFFODs+V1I5MD9kZChoclBfNCFRSUwtPy01OkA/WyZ1M2tFUDlaJWhDIWJUagoocF9vJkslMSUsWEZzRCpqNiQmZT0/KE0rZy0kaGhqWSZsdVcsRkZBZC1iRj5YLTxWOzVAcjgtcmAlOFxeV01rOkNMK2MtbVB1JDYtUG8uRwpeI1BiKlBlUjJlNi5NN0FXNHEiSks9ODZKKVdrXzI7MSYhMjdob11vPy0jbmllOkBcOmdAalpMZGItb0gtcjMzdVA7OGw5Yl5hOjolKD8xSworVyJ1SF5gISllckokMz4zJCI2OW5oOmQmTilDPTgwNVRYb1stbF06XTQuaDdSMj9cN2N0SFNIZCEyMUMvI2xGK0JxVS5KczEkQzo8LlttMAouIyxpckVfcj9aZGQoKnInQlsyLTFjUTBnWFVlMG0uU20vQTh1Yz9IKGVSVy9HKkdJJ291RUYtS3BlZmdZTyVvJVBYaEVIXFZObS03XmsqcwpicypebyhbYmJaWnAhVUFMZyFwLT1GYDRlS24jYFVbKTlrOkQoJClfLWpTajItczJKWERVKVhfWSwkUVA+JC48LixBUTRscV4vdUUrc3IoKApaSE5KS2gsdW9YVyVRXkVwTWBxPWIvNyRxLE4wPkxQVi4zP2kkQGYxXXBgKVovSV1pOyQoRlssOF9YI2Y2Mi5XMk9eaVNSPzMoU1o2MjtgUgpwTyMuKCEkQEhTRCN+PgplbmRzdHJlYW0KZW5kb2JqCjI4IDAgb2JqCjw8IC9UeXBlIC9YT2JqZWN0Ci9TdWJ0eXBlIC9JbWFnZQovV2lkdGggMTE4Ci9IZWlnaHQgNDkKL0NvbG9yU3BhY2UgL0RldmljZUdyYXkKL0JpdHNQZXJDb21wb25lbnQgOAovTGVuZ3RoIDQ2MQovRmlsdGVyIFsvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGVdCj4+c3RyZWFtCkdiIi9lSkldUj8jWG5Ya1Q2QT5YS25EYldCIk1aRWFqUHBkNF0nKF5AUmx0ImtCIlMwJGYlPz1tPTRDOzsuJE4oalJjWVIlc2QmbDkkT3ReCikmNz1MKDctZXFxZUAuKC9TQzk4NC1mTFhlTFo1cWNaNWxBRUI1NT4zQDA9ayI7UmgyaEJjUUwzJko/NW9bY0gwYlNGTl48OztANDFTWTltCmMiWkk9WWwjYzQpYF8iWWxtTjMlLkEubE5TYFZlL1k8JT8uNygoKS8uZEJbO2shSlslJyVESlxJPythNzo1b05rWVxxRVM+MzxJNWJabShJCiVkPEBCKThEYnQzcEtHY2xiUWsxJ2laVnM3Tk0wXG8mUipxVT5nSHUtRnJDa2g8a0hGRypcJE09X3NWLy0kXEpGOmUvPz5mWEErQ0NtcERlCmRTUDZHY3UsXFgnQUw9YTVKQ1s0NkcuaHAyPVU0ZV4kZW9cUSNiKm03QzgkLUpBKGNaP1lgJ0M7NkpwSGVQbFwkSEVDIXVeKlFhKzZnRU1rCltmRVYqYi4jPnByPi1XU2YjPmgmVz91a2tUc2hZYD0vWC42NkEqO2Jpcy9kZ0BRWFhzcjhtO34+CmVuZHN0cmVhbQplbmRvYmoKMjkgMCBvYmoKPDwgL1R5cGUgL1hPYmplY3QKL1N1YnR5cGUgL0ltYWdlCi9XaWR0aCA1NAovSGVpZ2h0IDU0Ci9Db2xvclNwYWNlIC9EZXZpY2VHcmF5Ci9CaXRzUGVyQ29tcG9uZW50IDgKL0xlbmd0aCA3NwovRmlsdGVyIFsvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGVdCj4+c3RyZWFtCkdiIjBKZDBUZHEkajRvRl5VLCJIVHM5RUlFOzBBVCxfRSpMWiVvQDdKbDVWO0gnQ3M9VHJxRGFILjRCZiNjNE9WVDsoZCNmPEdFOX4+CmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDMwCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMDQgMDAwMDAgbiAKMDAwMDAwMDE5MCAwMDAwMCBuIAowMDAwMDAwMjQyIDAwMDAwIG4gCjAwMDAwMDAzNDAgMDAwMDAgbiAKMDAwMDAwMDQ0MyAwMDAwMCBuIAowMDAwMDAwNTQ5IDAwMDAwIG4gCjAwMDAwMDA2NTkgMDAwMDAgbiAKMDAwMDAwMDc1NSAwMDAwMCBuIAowMDAwMDAwODU3IDAwMDAwIG4gCjAwMDAwMDA5NjIgMDAwMDAgbiAKMDAwMDAwMTA3MSAwMDAwMCBuIAowMDAwMDAxMTcyIDAwMDAwIG4gCjAwMDAwMDEyNzIgMDAwMDAgbiAKMDAwMDAwMTM3NCAwMDAwMCBuIAowMDAwMDAxNDgwIDAwMDAwIG4gCjAwMDAwMDE2NTAgMDAwMDAgbiAKMDAwMDAwMjA2NyAwMDAwMCBuIAowMDAwMDAyNDg0IDAwMDAwIG4gCjAwMDAwMDI5MDEgMDAwMDAgbiAKMDAwMDAwMzMxOCAwMDAwMCBuIAowMDAwMDAzNzM1IDAwMDAwIG4gCjAwMDAwMDYzOTUgMDAwMDAgbiAKMDAwMDAwOTQzNyAwMDAwMCBuIAowMDAwMDEwMDg0IDAwMDAwIG4gCjAwMDAwMTAzNDUgMDAwMDAgbiAKMDAwMDAxMjAwNCAwMDAwMCBuIAowMDAwMDEyNjUxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL0luZm8gMTcgMCBSCi9TaXplIDMwCi9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxMjkxMgolJUVPRgo=',
                                docType: 'PDF'
                            }
                        ],
                        currency: 'GBP',
                        customerReferences: [],
                        codcollectionAmount: 0,
                        baseRateAmount: 61.3
                    }
                ],
                shipmentAdvisoryDetails: {},
                completedShipmentDetail: {
                    usDomestic: false,
                    carrierCode: 'FDXE',
                    masterTrackingId: {
                        trackingIdType: 'FEDEX',
                        formId: '0430',
                        trackingNumber: '794636692361'
                    },
                    serviceDescription: {
                        serviceId: 'EP1000000004',
                        serviceType: 'INTERNATIONAL_ECONOMY',
                        code: '04',
                        names: [
                            {
                                type: 'long',
                                encoding: 'utf-8',
                                value: 'FedEx International EconomyÂ®'
                            },
                            {
                                type: 'long',
                                encoding: 'ascii',
                                value: 'FedEx International Economy'
                            },
                            {
                                type: 'medium',
                                encoding: 'utf-8',
                                value: 'FedEx International EconomyÂ®'
                            },
                            {
                                type: 'medium',
                                encoding: 'ascii',
                                value: 'FedEx International Economy'
                            },
                            {
                                type: 'short',
                                encoding: 'utf-8',
                                value: 'IE'
                            },
                            {
                                type: 'short',
                                encoding: 'ascii',
                                value: 'IE'
                            },
                            {
                                type: 'abbrv',
                                encoding: 'ascii',
                                value: 'IE'
                            }
                        ],
                        operatingOrgCodes: [
                            'FXE'
                        ],
                        serviceCategory: 'parcel',
                        description: 'International Economy',
                        astraDescription: 'IE'
                    },
                    packagingDescription: 'Customer Packaging',
                    operationalDetail: {
                        ursaPrefixCode: '9A',
                        ursaSuffixCode: 'QNQA ',
                        originLocationId: 'BBSB ',
                        originLocationNumber: 0,
                        originServiceArea: 'A1',
                        destinationLocationId: 'QNQA ',
                        destinationLocationNumber: 0,
                        destinationServiceArea: 'A1',
                        destinationLocationStateOrProvinceCode: 'NH',
                        deliveryDate: '',
                        deliveryDay: '',
                        commitDate: '',
                        commitDay: '',
                        ineligibleForMoneyBackGuarantee: false,
                        astraPlannedServiceLevel: 'A1',
                        astraDescription: 'INTL ECONOMY',
                        postalCode: '2132',
                        stateOrProvinceCode: 'NH',
                        countryCode: 'NL',
                        airportId: 'AMS',
                        serviceCode: '04',
                        packagingCode: '01',
                        publishedDeliveryTime: '',
                        scac: ''
                    },
                    shipmentRating: {
                        actualRateType: 'PAYOR_ACCOUNT_SHIPMENT',
                        shipmentRateDetails: [
                            {
                                rateType: 'PAYOR_ACCOUNT_SHIPMENT',
                                rateScale: 'GB001OFR_03_YOUR_PACKAGING',
                                rateZone: 'GB001O',
                                pricingCode: '',
                                ratedWeightMethod: 'ACTUAL',
                                currencyExchangeRate: {
                                    fromCurrency: 'GBP',
                                    intoCurrency: 'GBP',
                                    rate: 1
                                },
                                dimDivisor: 139,
                                fuelSurchargePercent: 19.5,
                                totalBillingWeight: {
                                    units: 'KG',
                                    value: 1
                                },
                                totalBaseCharge: 61.3,
                                totalFreightDiscounts: 0,
                                totalNetFreight: 61.3,
                                totalSurcharges: 12.91,
                                totalNetFedExCharge: 74.21,
                                totalTaxes: 0,
                                totalNetCharge: 74.21,
                                totalRebates: 0,
                                totalDutiesAndTaxes: 0,
                                totalAncillaryFeesAndTaxes: 0,
                                totalDutiesTaxesAndFees: 0,
                                totalNetChargeWithDutiesAndTaxes: 74.21,
                                surcharges: [
                                    {
                                        surchargeType: 'PEAK',
                                        description: 'Peak Surcharge',
                                        amount: 0.8
                                    },
                                    {
                                        surchargeType: 'FUEL',
                                        description: 'Fuel',
                                        amount: 12.11
                                    }
                                ],
                                freightDiscounts: [],
                                taxes: [],
                                currency: 'GBP'
                            }
                        ]
                    },
                    completedPackageDetails: [
                        {
                            sequenceNumber: 1,
                            trackingIds: [
                                {
                                    trackingIdType: 'FEDEX',
                                    formId: '0430',
                                    trackingNumber: '794636692361'
                                }
                            ],
                            groupNumber: 0,
                            signatureOption: 'SERVICE_DEFAULT',
                            operationalDetail: {
                                barcodes: {
                                    binaryBarcodes: [
                                        {
                                            type: 'COMMON_2D',
                                            value: 'Wyk+HjAxHTAyMjEzMh01MjgdMDQdNzk0NjM2NjkyMzYxMDQzMB1GREUdODAyMjU1MjA5HTE1Nx0dMS8xHTAuOTlLRx1OHTkwIEFsZGVybWFucyBIaWxsHUhvb2ZkZG9ycB1OSB1VbmRlciBBcm1vdXIgUmV0dXJucx4wNh0xMFpFSUkwOB0xMlozMTIwNzE1NTEwMB0xNVoxMTkyMTM2MTIdMzFaMTAxMDA5NTc1MDk2MTE1MzQxNjgwMDc5NDYzNjY5MjM2MR0zMlowMh0zOVpCQlNCHTk5WkVJMDAwNhxHQhwxHFVTRBxDb21tb2RpdHkgZGVzY3JpcHRpb24cHDgwMjI1NTIwOR0eMDkdRkRYHXodOB0CKTobODJ/QB4E'
                                        }
                                    ],
                                    stringBarcodes: [
                                        {
                                            type: 'FEDEX_1D',
                                            value: '1010095750961153416800794636692361'
                                        }
                                    ]
                                },
                                astraHandlingText: '',
                                operationalInstructions: [
                                    {
                                        number: 2,
                                        content: 'TRK#'
                                    },
                                    {
                                        number: 3,
                                        content: '0430'
                                    },
                                    {
                                        number: 5,
                                        content: '9A QNQA '
                                    },
                                    {
                                        number: 7,
                                        content: '1010095750961153416800794636692361'
                                    },
                                    {
                                        number: 8,
                                        content: '583J2/29AB/FE2D'
                                    },
                                    {
                                        number: 10,
                                        content: '7946 3669 2361'
                                    },
                                    {
                                        number: 12,
                                        content: 'A1'
                                    },
                                    {
                                        number: 13,
                                        content: 'INTL ECONOMY'
                                    },
                                    {
                                        number: 15,
                                        content: '2132'
                                    },
                                    {
                                        number: 16,
                                        content: 'NH-NL'
                                    },
                                    {
                                        number: 17,
                                        content: 'AMS'
                                    }
                                ]
                            }
                        }
                    ],
                    documentRequirements: {
                        requiredDocuments: [
                            'AIR_WAYBILL',
                            'COMMERCIAL_OR_PRO_FORMA_INVOICE'
                        ],
                        generationDetails: [
                            {
                                type: 'PRO_FORMA_INVOICE',
                                minimumCopiesRequired: 4,
                                letterhead: 'OPTIONAL',
                                electronicSignature: 'OPTIONAL'
                            },
                            {
                                type: 'AIR_WAYBILL',
                                minimumCopiesRequired: 4
                            },
                            {
                                type: 'COMMERCIAL_INVOICE',
                                minimumCopiesRequired: 4,
                                letterhead: 'OPTIONAL',
                                electronicSignature: 'OPTIONAL'
                            }
                        ],
                        prohibitedDocuments: [
                            'USMCA_COMMERCIAL_INVOICE_CERTIFICATION_OF_ORIGIN',
                            'USMCA_CERTIFICATION_OF_ORIGIN'
                        ]
                    }
                },
                serviceCategory: 'EXPRESS'
            }
        ]
    }
};

module.exports = {
    fedexAuthMock: fedexAuthMock,
    fedexLabelMock: fedexLabelMock
};
