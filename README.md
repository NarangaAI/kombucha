# 웰니스 콤부차 로컬 실행

Python 3.10 이상에서 저장소 폴더를 열고 아래 명령을 실행합니다. 추가 패키지는 필요하지 않습니다

```powershell
python server.py
```

브라우저에서 [로컬 미리보기](http://127.0.0.1:8418/)를 엽니다. 포트를 바꾸려면 `python server.py --port 8419`를 사용합니다

## 제품 문의 메일 연결

담당자가 받을 이메일과 발송용 SMTP 계정을 정한 뒤 서버 환경에 다음 값을 설정합니다. PowerShell에서는 같은 창에서 값을 지정하고 서버를 실행합니다

```powershell
$env:INQUIRY_TO = '담당자 수신 이메일'
$env:SMTP_FROM = '메일 서비스에서 승인한 발신 이메일'
$env:SMTP_HOST = '메일 서비스의 SMTP 호스트'
$env:SMTP_USER = 'SMTP 로그인 계정'
$env:SMTP_PASSWORD = [Net.NetworkCredential]::new('', (Read-Host 'SMTP 비밀번호 또는 앱 비밀번호' -AsSecureString)).Password
python server.py
```

기본 연결은 TLS 465번 포트입니다. 메일 서비스가 STARTTLS 587번을 안내하면 서버를 실행하기 전에 `$env:SMTP_SECURITY = 'starttls'`와 `$env:SMTP_PORT = '587'`을 지정합니다

방문자의 이메일은 회신 주소(Reply-To)로 설정됩니다. 담당자는 수신한 메일에서 **답장**을 눌러 방문자에게 회신할 수 있습니다. SMTP 서버가 수락한 뒤에만 접수 성공을 반환하며, 문의 내용을 파일에 보관하지 않습니다

운영 환경에서는 메일 비밀번호를 호스팅의 비밀 환경 변수에 저장합니다. HTTPS 웹 서버가 `dist/`를 제공하고 같은 도메인의 `/api/inquiries`와 `/api/inquiries/status`를 로컬 Python 서버로 프록시하도록 구성합니다. 프록시는 요청의 원래 `Host`를 전달해야 합니다. 서버는 루프백 주소에만 바인딩됩니다

로컬 리버스 프록시를 통해 운영할 때는 프록시가 `X-Real-IP`를 클라이언트 IP로 덮어쓰도록 구성한 뒤 `INQUIRY_TRUST_LOCAL_PROXY=1`을 설정합니다. 접수 시도는 IP별 10분간 5회, 서버 프로세스 전체에서 10분간 80회로 제한합니다
