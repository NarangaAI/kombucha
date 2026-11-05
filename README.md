# 웰니스 콤부차 로컬 실행

Python 3.10 이상에서 저장소 폴더를 열고 아래 명령을 실행합니다. 추가 패키지는 필요하지 않습니다

```powershell
python server.py
```

브라우저에서 [로컬 미리보기](http://127.0.0.1:8418/)를 엽니다. 포트를 바꾸려면 `python server.py --port 8419`를 사용합니다

## 제품 문의 메일 연결

문의 수신 주소는 `ceo@kombcha.co.kr`로 설정되어 있습니다. 실제 자동 전송에는 발송용 SMTP 계정 연결이 필요합니다. PowerShell에서는 같은 창에서 다음 값을 지정하고 서버를 실행합니다

```powershell
$env:SMTP_FROM = '메일 서비스에서 승인한 발신 이메일'
$env:SMTP_HOST = '메일 서비스의 SMTP 호스트'
$env:SMTP_USER = 'SMTP 로그인 계정'
$env:SMTP_PASSWORD = [Net.NetworkCredential]::new('', (Read-Host 'SMTP 비밀번호 또는 앱 비밀번호' -AsSecureString)).Password
python server.py
```

수신 주소를 변경할 때만 `INQUIRY_TO` 환경 변수를 지정합니다. SMTP 설정이 없으면 문의 제출을 비활성화하며, 수신 주소 지정만으로 메일이 전송되지는 않습니다

기본 연결은 TLS 465번 포트입니다. 메일 서비스가 STARTTLS 587번을 안내하면 서버를 실행하기 전에 `$env:SMTP_SECURITY = 'starttls'`와 `$env:SMTP_PORT = '587'`을 지정합니다

### 오피셜메일(OfficialMail) 연결

문의 수신 계정은 오피셜메일의 `ceo@kombcha.co.kr`입니다. 현재 확인된 계정은 무료(FREE) 플랜이며, 외부 연동 화면의 IMAP·SMTP 연결과 발송 API는 성장(Growth) 플랜 전용으로 잠겨 있습니다. [오피셜메일 공식 가이드](https://officialsite.kr/guide)도 외부 메일 앱의 SMTP 연결과 발송 API를 성장 플랜부터 제공한다고 안내합니다

현재 서버는 SMTP 방식으로 전송합니다. 오피셜메일의 성장 플랜에서 연결하는 경우, 외부 연동 화면에 표시되는 서버·포트·보안 방식에 맞춰 `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURITY`를 지정하고, `SMTP_USER`에는 전체 이메일 주소, `SMTP_FROM`에는 승인된 발신 주소를 지정합니다. `SMTP_PASSWORD`에는 로그인 비밀번호와 별도로 설정한 외부 연동 전용 비밀번호를 사용합니다

수신 주소 설정만으로 자동 전송이 활성화되지는 않습니다. 오피셜메일에서 SMTP를 사용할 수 있는 플랜과 연결 정보를 준비하거나 별도의 SMTP 발송 서비스를 연결해야 합니다. 별도 서비스를 사용해도 수신 주소는 `ceo@kombcha.co.kr`로 유지할 수 있습니다. 비밀번호나 API 키는 저장소에 기록하지 않으며, 위의 보안 입력창 또는 운영 환경의 비밀 환경 변수로 설정합니다

방문자의 이메일은 회신 주소(Reply-To)로 설정됩니다. 담당자는 수신한 메일에서 **답장**을 눌러 방문자에게 회신할 수 있습니다. SMTP 서버가 수락한 뒤에만 접수 성공을 반환하며, 문의 내용을 파일에 보관하지 않습니다

운영 환경에서는 메일 비밀번호를 호스팅의 비밀 환경 변수에 저장합니다. HTTPS 웹 서버가 `dist/`를 제공하고 같은 도메인의 `/api/inquiries`와 `/api/inquiries/status`를 로컬 Python 서버로 프록시하도록 구성합니다. 프록시는 요청의 원래 `Host`를 전달해야 합니다. 서버는 루프백 주소에만 바인딩됩니다

로컬 리버스 프록시를 통해 운영할 때는 프록시가 `X-Real-IP`를 클라이언트 IP로 덮어쓰도록 구성한 뒤 `INQUIRY_TRUST_LOCAL_PROXY=1`을 설정합니다. 접수 시도는 IP별 10분간 5회, 서버 프로세스 전체에서 10분간 80회로 제한합니다
