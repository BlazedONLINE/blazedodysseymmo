// Blazed Odyssey interactivity
const form = document.getElementById('signupForm'); const btn = document.getElementById('signupBtn');
function showError(el,msg){el.textContent=msg;} function clearErrors(){document.querySelectorAll('.error').forEach(e=>e.textContent='');}
form.addEventListener('input',()=>{const u=form.username.value.trim();const e=form.email.value.trim();const p=form.password.value;const c=form.confirm.value;let valid=true;
if(!/^[a-zA-Z0-9_]{3,15}$/.test(u)){showError(document.getElementById('usernameError'),'3-15 chars, letters/numbers/_ only');valid=false;}
if(!/^[^@]+@[^@]+\.[^@]+$/.test(e)){showError(document.getElementById('emailError'),'Invalid email');valid=false;}
if(p.length<6){showError(document.getElementById('passwordError'),'Password must be 6+ chars');valid=false;}
if(p!==c){showError(document.getElementById('confirmError'),'Passwords do not match');valid=false;}
btn.disabled=!valid||!window.BO_CONFIG?.API_BASE_URL;});
form.addEventListener('submit',async e=>{e.preventDefault();clearErrors();const u=form.username.value.trim();const eVal=form.email.value.trim();const p=form.password.value;const api=window.BO_CONFIG?.API_BASE_URL;if(!api)return alert('Signup API not configured');
try{const res=await fetch(api+'/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,email:eVal,password:p})});
const data=await res.json();if(data.ok||data.success){alert('Account created!');form.reset();btn.disabled=true;}else{alert(data.error||data.message||'Signup failed');}}catch(err){alert('Signup service unavailable');}});
// Updates loading
async function loadUpdates(){try{const res=await fetch('updates.json');const list=document.getElementById('updatesList');const data=await res.json();
data.forEach(u=>{const div=document.createElement('div');div.className='card';div.innerHTML='<h4>'+u.date+' - '+u.title+'</h4><p>'+u.summary+'</p>';list.appendChild(div);});}catch(err){console.error('Failed to load updates');}}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('year').textContent=new Date().getFullYear();loadUpdates();});
