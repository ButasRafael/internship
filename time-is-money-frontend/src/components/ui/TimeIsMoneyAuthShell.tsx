import type { PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'

type Props = PropsWithChildren<{
    title: string
    subtitle?: string
    activeTab?: 'login' | 'register'
}>

const styles = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");

.tim-auth {
  font-family: Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  background:
    radial-gradient(1200px 600px at 80% -20%, rgba(30,94,255,.08), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(16,185,129,.06), transparent 50%),
    #DEE1E7;
}
.tim-auth * { margin:0; padding:0; box-sizing:border-box; }

.tim-auth .container {
  width: min(1120px, 96vw);
  height: min(820px, calc(100dvh - 64px));
  margin: 0 auto;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 20px 60px rgba(16,24,40,.08);
}

.tim-auth .detalis-main {
  width: 54%;
  min-width: 320px;
  padding: 40px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tim-auth .logo { width: 196px; height: auto; margin: 8px auto 44px; display: block; }

/* Right image */
.tim-auth .money-locker {
  width: 46%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.tim-auth .switch-details {
  border-radius: 12px;
  width: 360px; height: 46px;
  padding: 4px; margin: 16px auto 0;
  background: #F0EFF2; display: flex; gap: 4px;
}
.tim-auth .btn-switch {
  flex: 1;
  border-radius: 10px; line-height: 38px;
  font-weight: 600; font-size: 12px; cursor: pointer; user-select: none; text-align: center;
  transition: transform .15s ease, background .15s ease, color .15s ease, box-shadow .15s ease;
}
.tim-auth .btn-switch:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.08); }

.tim-auth .input-main {
  width: 360px; height: 54px;
  margin: 18px auto 0;
  border: 1px solid #E1E4EA; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: #fff;
  transition: box-shadow .18s ease, border-color .18s ease;
}
.tim-auth .input-main:focus-within { border-color: #C7D2FE; box-shadow: 0 0 0 4px rgba(30,94,255,.08); }
.tim-auth .input { width: 100%; border: 0; outline: 0; background: transparent; }
.tim-auth .be-main { width: 1px; height: 28px; background: #D2D2D2; margin-left: 10px; }
.tim-auth .icon-email { width: 16px; height: 16px; }

.tim-auth .input-box { width: 280px; margin: 0 10px; position: relative; }
.tim-auth .input-box label {
  position: absolute; left: 0; top: 2px; font-size: .8rem; color: #6B7280; pointer-events: none; transition: .2s ease;
}
.tim-auth .input:focus ~ label,
.tim-auth .input:not(:placeholder-shown) ~ label { font-size: .6rem; top: -11px; color: #1E5EFF; }

.tim-auth .continue {
  background: #0266ff; color: #fff; border: 0; width: 360px; height: 50px; border-radius: 12px; font-size: 14px; margin-top: 16px; cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, background .2s ease; box-shadow: 0 2px 0 rgba(0,0,0,.02);
}
.tim-auth .continue:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(2,102,255,.22); }
.tim-auth .continue:active { transform: translateY(0); box-shadow: 0 6px 14px rgba(2,102,255,.18); }
.tim-auth .continue:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }

.tim-auth .with-social { display: flex; align-items: center; margin: 20px auto 0; width: 186px; }
.tim-auth .social { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 14px; cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; }
.tim-auth .social:last-child { margin-right: 0; }
.tim-auth .google{ background:#9e9e9e; } .tim-auth .apple{ background:#000; } .tim-auth .facebook{ background:#1977f2; }
.tim-auth .social svg{ fill:#fff; }
.tim-auth .social:hover{ transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.12); }
.tim-auth .social:active{ transform: translateY(0); filter: brightness(.95); }

.tim-auth .login-main h1 { font-size: 1.7rem; }
.tim-auth .login-main p  { font-size: .95rem; margin-top: 8px; color: #8B8F96; }
.tim-auth .login-main { text-align: center; }

.tim-auth .title-social { color:#6B7280; font-size:.82rem; display:flex; width:330px; margin:18px auto 0; align-items:center; }
.tim-auth .title-social::before, .tim-auth .title-social::after { content:""; display:block; flex:1; height:1px; background:#DADDE3; }
.tim-auth .title-social::before { margin-right:13px; } .tim-auth .title-social::after { margin-left:13px; }
.tim-auth .paragraph-description { margin:18px 24px 0; font-size:.78rem; color:#7A7F87; text-align:center; }

@media (max-width: 1020px) {
  .tim-auth .container { width:min(600px, 96vw); height:auto; }
  .tim-auth .money-locker { display:none; }
  .tim-auth .detalis-main { width:100%; padding:28px 16px 24px; }
  .tim-auth .switch-details, .tim-auth .input-main, .tim-auth .continue, .tim-auth .title-social { width:100%; max-width:360px; }
}
@media (max-width: 540px) {
  .tim-auth .container { border-radius:16px; }
  .tim-auth .logo { width:170px; margin-bottom:36px; }
}
`;

export default function TimeIsMoneyAuthShell({ title, subtitle, activeTab, children }: Props) {
    const nav = useNavigate()

    return (
        <div className="tim-auth">
            <style>{styles}</style>

            <div className="container">
                <div className="detalis-main">
                    <div className="login-main">
                        <img className="logo" src="/tim-logo.png" alt="Time is Money" />
                        <h1>{title}</h1>
                        {subtitle && <p>{subtitle}</p>}
                    </div>

                    {activeTab && (
                        <div className="switch-details">
                            <div
                                className="btn-switch"
                                style={{ background: activeTab === 'login' ? '#fff' : 'transparent', color: activeTab === 'login' ? '#000' : '#737375' }}
                                onClick={() => nav('/login')}
                            >
                                Sign in
                            </div>
                            <div
                                className="btn-switch"
                                style={{ background: activeTab === 'register' ? '#fff' : 'transparent', color: activeTab === 'register' ? '#000' : '#737375' }}
                                onClick={() => nav('/register')}
                            >
                                Sign up
                            </div>
                        </div>
                    )}

                    {children}
                </div>

                {}
                <img
                    className="money-locker"
                    src="https://raw.githubusercontent.com/emnatkins/cdn-codepen/main/money-locker.jpg"
                    alt="Illustration"
                    loading="lazy"
                />
            </div>
        </div>
    )
}
