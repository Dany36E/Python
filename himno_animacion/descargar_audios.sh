#!/usr/bin/env bash
# Descarga las 31 tomas finales a audio/<LINEA>.mp3
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p audio
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_172853_28647a6c-9b42-407e-bbfa-405347b8b959.mp3" -o audio/N01.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173615_56fea26f-7fb1-4952-8b86-9a086d89c8ef.mp3" -o audio/N02.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_164045_6e32a0d2-5f0c-4788-bd9c-ca3fceccbf74.mp3" -o audio/S01.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173604_90659d81-0588-49ec-adbb-c28b99ef74d9.mp3" -o audio/N03.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173604_3facc89d-b315-41f3-9a09-ed8db3c7363e.mp3" -o audio/N04.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173615_9d152b7d-1d9b-4e3b-b242-e21cbdf64501.mp3" -o audio/N05.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173615_cb94b438-0f75-40aa-b5f0-c90abcbd3550.mp3" -o audio/N06.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173635_5815c523-e0db-4b62-8ef0-8a42ee8e80c3.mp3" -o audio/N07.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_172853_55fe1a3b-97d5-48f4-8dc3-a22234c0e05d.mp3" -o audio/L01.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173635_d51dae59-145e-4e2d-af63-2483cf3319f1.mp3" -o audio/N08.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173635_e5668539-aa83-42ca-b5d3-81a88feeb35f.mp3" -o audio/N09.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173536_1eb06756-4c75-440f-9edd-4b37e3e2a4c3.mp3" -o audio/L02.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173649_dbde4a51-c42a-4f4c-830e-90a2d5fb4f9b.mp3" -o audio/N10.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173649_ae2f6943-d876-404b-a8e0-af931c4bb2e7.mp3" -o audio/N11.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173648_581fd39b-4987-4bc6-a7ea-a018effa12df.mp3" -o audio/N12.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173712_11f7ff5a-68ee-4157-8fb9-c1893b6b63c0.mp3" -o audio/N13.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173523_f640581f-5560-4a2a-9cae-190831b9dbd7.mp3" -o audio/F01.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173702_2048b6e8-eae9-40f9-8ddf-4782fa3c1dcf.mp3" -o audio/N14.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173701_a4ee88ae-0a5d-4f96-8bc7-7e59e2e5977f.mp3" -o audio/N15.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173712_36ac7671-cc40-4dcd-ae6f-ed106f822cbb.mp3" -o audio/N16.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173712_095bf7a6-f738-4e1b-8d62-f9327e2aa449.mp3" -o audio/N17.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173724_0daa0ffe-fbfe-42a2-8d38-37be39816a4d.mp3" -o audio/N18.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173736_0a140cde-fab9-438c-98ef-ffab74bf518f.mp3" -o audio/N19.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173724_63f6d119-51c2-40da-ad5f-431f69a50d5f.mp3" -o audio/N20.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173736_4d86eb77-61bc-46c2-942d-fa42f51cfb47.mp3" -o audio/N21.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173736_c53e4f72-b7e0-479e-b5c4-5fcf4906c6c6.mp3" -o audio/N22.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173748_719b7296-1c7a-4311-b8d0-6ae2baab7274.mp3" -o audio/N23.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173748_e0e97c80-6701-4611-bd4a-753f5d2b1a2c.mp3" -o audio/N24.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173758_71051d88-81ab-40e1-ac44-23e865a12e7b.mp3" -o audio/N25.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173759_61d97115-8839-4d77-a389-912a8cad76c8.mp3" -o audio/N26.mp3
curl -sSfL "https://d8j0ntlcm91z4.cloudfront.net/user_3KO467D5NUsqbdJfKwYB0d7av3D/hf_20261023_173758_150deb6d-96a4-4063-8683-bb4d45ba61e5.mp3" -o audio/N27.mp3
echo "Listo: $(ls audio/*.mp3 | wc -l) archivos en audio/"
