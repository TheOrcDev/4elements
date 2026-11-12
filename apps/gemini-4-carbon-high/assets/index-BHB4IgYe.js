(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(a){if(a.ep)return;a.ep=!0;const r=t(a);fetch(a.href,r)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ks="170",ra={ROTATE:0,DOLLY:1,PAN:2},Qi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Wu=0,pl=1,Gu=2,Kc=1,Hu=2,Un=3,Xn=0,Lt=1,Bt=2,Wn=0,Yt=1,Pi=2,ml=3,vl=4,Xu=5,bi=100,qu=101,Yu=102,Zu=103,ju=104,$u=200,Ku=201,Ju=202,Qu=203,Zo=204,jo=205,ed=206,td=207,nd=208,id=209,ad=210,rd=211,od=212,sd=213,ld=214,$o=0,Ko=1,Jo=2,ca=3,Qo=4,es=5,ts=6,ns=7,Jc=0,cd=1,ud=2,hi=0,Qc=1,eu=2,tu=3,Vs=4,dd=5,nu=6,iu=7,au=300,ua=301,da=302,is=303,as=304,Jr=306,rs=1e3,Ai=1001,os=1002,un=1003,hd=1004,Ja=1005,En=1006,ho=1007,Ei=1008,qn=1009,ru=1010,ou=1011,Ha=1012,Ws=1013,Ri=1014,Cn=1015,Pn=1016,Gs=1017,Hs=1018,ha=1020,su=35902,lu=1021,cu=1022,Sn=1023,uu=1024,du=1025,oa=1026,fa=1027,Xs=1028,qs=1029,hu=1030,Ys=1031,Zs=1033,Ur=33776,zr=33777,Or=33778,Br=33779,ss=35840,ls=35841,cs=35842,us=35843,ds=36196,hs=37492,fs=37496,ps=37808,ms=37809,vs=37810,gs=37811,xs=37812,_s=37813,ys=37814,Ms=37815,Ss=37816,ws=37817,bs=37818,Ts=37819,As=37820,Es=37821,kr=36492,Cs=36494,Ps=36495,fu=36283,Rs=36284,Ds=36285,Ls=36286,fd=3200,pd=3201,md=0,vd=1,oi="",cn="srgb",ga="srgb-linear",Qr="linear",St="srgb",Ii=7680,gl=519,gd=512,xd=513,_d=514,pu=515,yd=516,Md=517,Sd=518,wd=519,xl=35044,bd=35048,_l="300 es",kn=2e3,qr=2001;class Li{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const a=this._listeners[e];if(a!==void 0){const r=a.indexOf(t);r!==-1&&a.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const a=i.slice(0);for(let r=0,o=a.length;r<o;r++)a[r].call(this,e);e.target=null}}}const Wt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Vr=Math.PI/180,Ns=180/Math.PI;function Za(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Wt[n&255]+Wt[n>>8&255]+Wt[n>>16&255]+Wt[n>>24&255]+"-"+Wt[e&255]+Wt[e>>8&255]+"-"+Wt[e>>16&15|64]+Wt[e>>24&255]+"-"+Wt[t&63|128]+Wt[t>>8&255]+"-"+Wt[t>>16&255]+Wt[t>>24&255]+Wt[i&255]+Wt[i>>8&255]+Wt[i>>16&255]+Wt[i>>24&255]).toLowerCase()}function qt(n,e,t){return Math.max(e,Math.min(t,n))}function Td(n,e){return(n%e+e)%e}function fo(n,e,t){return(1-t)*n+t*e}function ba(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Kt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const Ad={DEG2RAD:Vr};class Le{constructor(e=0,t=0){Le.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,a=e.elements;return this.x=a[0]*t+a[3]*i+a[6],this.y=a[1]*t+a[4]*i+a[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(qt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),a=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*a+e.x,this.y=r*a+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class at{constructor(e,t,i,a,r,o,s,l,c){at.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,a,r,o,s,l,c)}set(e,t,i,a,r,o,s,l,c){const f=this.elements;return f[0]=e,f[1]=a,f[2]=s,f[3]=t,f[4]=r,f[5]=l,f[6]=i,f[7]=o,f[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,a=t.elements,r=this.elements,o=i[0],s=i[3],l=i[6],c=i[1],f=i[4],d=i[7],h=i[2],p=i[5],g=i[8],x=a[0],m=a[3],u=a[6],M=a[1],S=a[4],v=a[7],T=a[2],w=a[5],E=a[8];return r[0]=o*x+s*M+l*T,r[3]=o*m+s*S+l*w,r[6]=o*u+s*v+l*E,r[1]=c*x+f*M+d*T,r[4]=c*m+f*S+d*w,r[7]=c*u+f*v+d*E,r[2]=h*x+p*M+g*T,r[5]=h*m+p*S+g*w,r[8]=h*u+p*v+g*E,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],a=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],f=e[8];return t*o*f-t*s*c-i*r*f+i*s*l+a*r*c-a*o*l}invert(){const e=this.elements,t=e[0],i=e[1],a=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],f=e[8],d=f*o-s*c,h=s*l-f*r,p=c*r-o*l,g=t*d+i*h+a*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return e[0]=d*x,e[1]=(a*c-f*i)*x,e[2]=(s*i-a*o)*x,e[3]=h*x,e[4]=(f*t-a*l)*x,e[5]=(a*r-s*t)*x,e[6]=p*x,e[7]=(i*l-c*t)*x,e[8]=(o*t-i*r)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,a,r,o,s){const l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*s)+o+e,-a*c,a*l,-a*(-c*o+l*s)+s+t,0,0,1),this}scale(e,t){return this.premultiply(po.makeScale(e,t)),this}rotate(e){return this.premultiply(po.makeRotation(-e)),this}translate(e,t){return this.premultiply(po.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let a=0;a<9;a++)if(t[a]!==i[a])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const po=new at;function mu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Yr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Ed(){const n=Yr("canvas");return n.style.display="block",n}const yl={};function Fa(n){n in yl||(yl[n]=!0,console.warn(n))}function Cd(n,e,t){return new Promise(function(i,a){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:a();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}function Pd(n){const e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Rd(n){const e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}const ht={enabled:!0,workingColorSpace:ga,spaces:{},convert:function(n,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===St&&(n.r=Gn(n.r),n.g=Gn(n.g),n.b=Gn(n.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(n.applyMatrix3(this.spaces[e].toXYZ),n.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===St&&(n.r=sa(n.r),n.g=sa(n.g),n.b=sa(n.b))),n},fromWorkingColorSpace:function(n,e){return this.convert(n,this.workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===oi?Qr:this.spaces[n].transfer},getLuminanceCoefficients:function(n,e=this.workingColorSpace){return n.fromArray(this.spaces[e].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,e,t){return n.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace}};function Gn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function sa(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}const Ml=[.64,.33,.3,.6,.15,.06],Sl=[.2126,.7152,.0722],wl=[.3127,.329],bl=new at().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Tl=new at().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ht.define({[ga]:{primaries:Ml,whitePoint:wl,transfer:Qr,toXYZ:bl,fromXYZ:Tl,luminanceCoefficients:Sl,workingColorSpaceConfig:{unpackColorSpace:cn},outputColorSpaceConfig:{drawingBufferColorSpace:cn}},[cn]:{primaries:Ml,whitePoint:wl,transfer:St,toXYZ:bl,fromXYZ:Tl,luminanceCoefficients:Sl,outputColorSpaceConfig:{drawingBufferColorSpace:cn}}});let Ui;class Dd{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Ui===void 0&&(Ui=Yr("canvas")),Ui.width=e.width,Ui.height=e.height;const i=Ui.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=Ui}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Yr("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const a=i.getImageData(0,0,e.width,e.height),r=a.data;for(let o=0;o<r.length;o++)r[o]=Gn(r[o]/255)*255;return i.putImageData(a,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Gn(t[i]/255)*255):t[i]=Gn(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Ld=0;class vu{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ld++}),this.uuid=Za(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},a=this.data;if(a!==null){let r;if(Array.isArray(a)){r=[];for(let o=0,s=a.length;o<s;o++)a[o].isDataTexture?r.push(mo(a[o].image)):r.push(mo(a[o]))}else r=mo(a);i.url=r}return t||(e.images[this.uuid]=i),i}}function mo(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Dd.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Nd=0;class jt extends Li{constructor(e=jt.DEFAULT_IMAGE,t=jt.DEFAULT_MAPPING,i=Ai,a=Ai,r=En,o=Ei,s=Sn,l=qn,c=jt.DEFAULT_ANISOTROPY,f=oi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Nd++}),this.uuid=Za(),this.name="",this.source=new vu(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=a,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=s,this.internalFormat=null,this.type=l,this.offset=new Le(0,0),this.repeat=new Le(1,1),this.center=new Le(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new at,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==au)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case rs:e.x=e.x-Math.floor(e.x);break;case Ai:e.x=e.x<0?0:1;break;case os:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case rs:e.y=e.y-Math.floor(e.y);break;case Ai:e.y=e.y<0?0:1;break;case os:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}jt.DEFAULT_IMAGE=null;jt.DEFAULT_MAPPING=au;jt.DEFAULT_ANISOTROPY=1;class wt{constructor(e=0,t=0,i=0,a=1){wt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=a}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,a){return this.x=e,this.y=t,this.z=i,this.w=a,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,a=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*a+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*a+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*a+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*a+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,a,r;const l=e.elements,c=l[0],f=l[4],d=l[8],h=l[1],p=l[5],g=l[9],x=l[2],m=l[6],u=l[10];if(Math.abs(f-h)<.01&&Math.abs(d-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(f+h)<.1&&Math.abs(d+x)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+u-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const S=(c+1)/2,v=(p+1)/2,T=(u+1)/2,w=(f+h)/4,E=(d+x)/4,C=(g+m)/4;return S>v&&S>T?S<.01?(i=0,a=.707106781,r=.707106781):(i=Math.sqrt(S),a=w/i,r=E/i):v>T?v<.01?(i=.707106781,a=0,r=.707106781):(a=Math.sqrt(v),i=w/a,r=C/a):T<.01?(i=.707106781,a=.707106781,r=0):(r=Math.sqrt(T),i=E/r,a=C/r),this.set(i,a,r,t),this}let M=Math.sqrt((m-g)*(m-g)+(d-x)*(d-x)+(h-f)*(h-f));return Math.abs(M)<.001&&(M=1),this.x=(m-g)/M,this.y=(d-x)/M,this.z=(h-f)/M,this.w=Math.acos((c+p+u-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Fd extends Li{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new wt(0,0,e,t),this.scissorTest=!1,this.viewport=new wt(0,0,e,t);const a={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:En,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);const r=new jt(a,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];const o=i.count;for(let s=0;s<o;s++)this.textures[s]=r.clone(),this.textures[s].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let a=0,r=this.textures.length;a<r;a++)this.textures[a].image.width=e,this.textures[a].image.height=t,this.textures[a].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,a=e.textures.length;i<a;i++)this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new vu(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class vn extends Fd{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class gu extends jt{constructor(e=null,t=1,i=1,a=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:a},this.magFilter=un,this.minFilter=un,this.wrapR=Ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Id extends jt{constructor(e=null,t=1,i=1,a=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:a},this.magFilter=un,this.minFilter=un,this.wrapR=Ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Yn{constructor(e=0,t=0,i=0,a=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=a}static slerpFlat(e,t,i,a,r,o,s){let l=i[a+0],c=i[a+1],f=i[a+2],d=i[a+3];const h=r[o+0],p=r[o+1],g=r[o+2],x=r[o+3];if(s===0){e[t+0]=l,e[t+1]=c,e[t+2]=f,e[t+3]=d;return}if(s===1){e[t+0]=h,e[t+1]=p,e[t+2]=g,e[t+3]=x;return}if(d!==x||l!==h||c!==p||f!==g){let m=1-s;const u=l*h+c*p+f*g+d*x,M=u>=0?1:-1,S=1-u*u;if(S>Number.EPSILON){const T=Math.sqrt(S),w=Math.atan2(T,u*M);m=Math.sin(m*w)/T,s=Math.sin(s*w)/T}const v=s*M;if(l=l*m+h*v,c=c*m+p*v,f=f*m+g*v,d=d*m+x*v,m===1-s){const T=1/Math.sqrt(l*l+c*c+f*f+d*d);l*=T,c*=T,f*=T,d*=T}}e[t]=l,e[t+1]=c,e[t+2]=f,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,a,r,o){const s=i[a],l=i[a+1],c=i[a+2],f=i[a+3],d=r[o],h=r[o+1],p=r[o+2],g=r[o+3];return e[t]=s*g+f*d+l*p-c*h,e[t+1]=l*g+f*h+c*d-s*p,e[t+2]=c*g+f*p+s*h-l*d,e[t+3]=f*g-s*d-l*h-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,a){return this._x=e,this._y=t,this._z=i,this._w=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,a=e._y,r=e._z,o=e._order,s=Math.cos,l=Math.sin,c=s(i/2),f=s(a/2),d=s(r/2),h=l(i/2),p=l(a/2),g=l(r/2);switch(o){case"XYZ":this._x=h*f*d+c*p*g,this._y=c*p*d-h*f*g,this._z=c*f*g+h*p*d,this._w=c*f*d-h*p*g;break;case"YXZ":this._x=h*f*d+c*p*g,this._y=c*p*d-h*f*g,this._z=c*f*g-h*p*d,this._w=c*f*d+h*p*g;break;case"ZXY":this._x=h*f*d-c*p*g,this._y=c*p*d+h*f*g,this._z=c*f*g+h*p*d,this._w=c*f*d-h*p*g;break;case"ZYX":this._x=h*f*d-c*p*g,this._y=c*p*d+h*f*g,this._z=c*f*g-h*p*d,this._w=c*f*d+h*p*g;break;case"YZX":this._x=h*f*d+c*p*g,this._y=c*p*d+h*f*g,this._z=c*f*g-h*p*d,this._w=c*f*d-h*p*g;break;case"XZY":this._x=h*f*d-c*p*g,this._y=c*p*d-h*f*g,this._z=c*f*g+h*p*d,this._w=c*f*d+h*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,a=Math.sin(i);return this._x=e.x*a,this._y=e.y*a,this._z=e.z*a,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],a=t[4],r=t[8],o=t[1],s=t[5],l=t[9],c=t[2],f=t[6],d=t[10],h=i+s+d;if(h>0){const p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(f-l)*p,this._y=(r-c)*p,this._z=(o-a)*p}else if(i>s&&i>d){const p=2*Math.sqrt(1+i-s-d);this._w=(f-l)/p,this._x=.25*p,this._y=(a+o)/p,this._z=(r+c)/p}else if(s>d){const p=2*Math.sqrt(1+s-i-d);this._w=(r-c)/p,this._x=(a+o)/p,this._y=.25*p,this._z=(l+f)/p}else{const p=2*Math.sqrt(1+d-i-s);this._w=(o-a)/p,this._x=(r+c)/p,this._y=(l+f)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(qt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const a=Math.min(1,t/i);return this.slerp(e,a),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,a=e._y,r=e._z,o=e._w,s=t._x,l=t._y,c=t._z,f=t._w;return this._x=i*f+o*s+a*c-r*l,this._y=a*f+o*l+r*s-i*c,this._z=r*f+o*c+i*l-a*s,this._w=o*f-i*s-a*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,a=this._y,r=this._z,o=this._w;let s=o*e._w+i*e._x+a*e._y+r*e._z;if(s<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,s=-s):this.copy(e),s>=1)return this._w=o,this._x=i,this._y=a,this._z=r,this;const l=1-s*s;if(l<=Number.EPSILON){const p=1-t;return this._w=p*o+t*this._w,this._x=p*i+t*this._x,this._y=p*a+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}const c=Math.sqrt(l),f=Math.atan2(c,s),d=Math.sin((1-t)*f)/c,h=Math.sin(t*f)/c;return this._w=o*d+this._w*h,this._x=i*d+this._x*h,this._y=a*d+this._y*h,this._z=r*d+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),a=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(a*Math.sin(e),a*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class D{constructor(e=0,t=0,i=0){D.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Al.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Al.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,a=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*a,this.y=r[1]*t+r[4]*i+r[7]*a,this.z=r[2]*t+r[5]*i+r[8]*a,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,a=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*a+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*a+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*a+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*a+r[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,a=this.z,r=e.x,o=e.y,s=e.z,l=e.w,c=2*(o*a-s*i),f=2*(s*t-r*a),d=2*(r*i-o*t);return this.x=t+l*c+o*d-s*f,this.y=i+l*f+s*c-r*d,this.z=a+l*d+r*f-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,a=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*a,this.y=r[1]*t+r[5]*i+r[9]*a,this.z=r[2]*t+r[6]*i+r[10]*a,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,a=e.y,r=e.z,o=t.x,s=t.y,l=t.z;return this.x=a*l-r*s,this.y=r*o-i*l,this.z=i*s-a*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return vo.copy(this).projectOnVector(e),this.sub(vo)}reflect(e){return this.sub(vo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(qt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,a=this.z-e.z;return t*t+i*i+a*a}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const a=Math.sin(t)*e;return this.x=a*Math.sin(i),this.y=Math.cos(t)*e,this.z=a*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),a=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=a,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const vo=new D,Al=new Yn;class Ni{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(xn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(xn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=xn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,s=r.count;o<s;o++)e.isMesh===!0?e.getVertexPosition(o,xn):xn.fromBufferAttribute(r,o),xn.applyMatrix4(e.matrixWorld),this.expandByPoint(xn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Qa.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Qa.copy(i.boundingBox)),Qa.applyMatrix4(e.matrixWorld),this.union(Qa)}const a=e.children;for(let r=0,o=a.length;r<o;r++)this.expandByObject(a[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,xn),xn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ta),er.subVectors(this.max,Ta),zi.subVectors(e.a,Ta),Oi.subVectors(e.b,Ta),Bi.subVectors(e.c,Ta),Jn.subVectors(Oi,zi),Qn.subVectors(Bi,Oi),pi.subVectors(zi,Bi);let t=[0,-Jn.z,Jn.y,0,-Qn.z,Qn.y,0,-pi.z,pi.y,Jn.z,0,-Jn.x,Qn.z,0,-Qn.x,pi.z,0,-pi.x,-Jn.y,Jn.x,0,-Qn.y,Qn.x,0,-pi.y,pi.x,0];return!go(t,zi,Oi,Bi,er)||(t=[1,0,0,0,1,0,0,0,1],!go(t,zi,Oi,Bi,er))?!1:(tr.crossVectors(Jn,Qn),t=[tr.x,tr.y,tr.z],go(t,zi,Oi,Bi,er))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,xn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(xn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Dn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Dn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Dn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Dn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Dn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Dn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Dn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Dn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Dn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Dn=[new D,new D,new D,new D,new D,new D,new D,new D],xn=new D,Qa=new Ni,zi=new D,Oi=new D,Bi=new D,Jn=new D,Qn=new D,pi=new D,Ta=new D,er=new D,tr=new D,mi=new D;function go(n,e,t,i,a){for(let r=0,o=n.length-3;r<=o;r+=3){mi.fromArray(n,r);const s=a.x*Math.abs(mi.x)+a.y*Math.abs(mi.y)+a.z*Math.abs(mi.z),l=e.dot(mi),c=t.dot(mi),f=i.dot(mi);if(Math.max(-Math.max(l,c,f),Math.min(l,c,f))>s)return!1}return!0}const Ud=new Ni,Aa=new D,xo=new D;class xa{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Ud.setFromPoints(e).getCenter(i);let a=0;for(let r=0,o=e.length;r<o;r++)a=Math.max(a,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(a),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Aa.subVectors(e,this.center);const t=Aa.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),a=(i-this.radius)*.5;this.center.addScaledVector(Aa,a/i),this.radius+=a}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(xo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Aa.copy(e.center).add(xo)),this.expandByPoint(Aa.copy(e.center).sub(xo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Ln=new D,_o=new D,nr=new D,ei=new D,yo=new D,ir=new D,Mo=new D;class eo{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ln)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Ln.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ln.copy(this.origin).addScaledVector(this.direction,t),Ln.distanceToSquared(e))}distanceSqToSegment(e,t,i,a){_o.copy(e).add(t).multiplyScalar(.5),nr.copy(t).sub(e).normalize(),ei.copy(this.origin).sub(_o);const r=e.distanceTo(t)*.5,o=-this.direction.dot(nr),s=ei.dot(this.direction),l=-ei.dot(nr),c=ei.lengthSq(),f=Math.abs(1-o*o);let d,h,p,g;if(f>0)if(d=o*l-s,h=o*s-l,g=r*f,d>=0)if(h>=-g)if(h<=g){const x=1/f;d*=x,h*=x,p=d*(d+o*h+2*s)+h*(o*d+h+2*l)+c}else h=r,d=Math.max(0,-(o*h+s)),p=-d*d+h*(h+2*l)+c;else h=-r,d=Math.max(0,-(o*h+s)),p=-d*d+h*(h+2*l)+c;else h<=-g?(d=Math.max(0,-(-o*r+s)),h=d>0?-r:Math.min(Math.max(-r,-l),r),p=-d*d+h*(h+2*l)+c):h<=g?(d=0,h=Math.min(Math.max(-r,-l),r),p=h*(h+2*l)+c):(d=Math.max(0,-(o*r+s)),h=d>0?r:Math.min(Math.max(-r,-l),r),p=-d*d+h*(h+2*l)+c);else h=o>0?-r:r,d=Math.max(0,-(o*h+s)),p=-d*d+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),a&&a.copy(_o).addScaledVector(nr,h),p}intersectSphere(e,t){Ln.subVectors(e.center,this.origin);const i=Ln.dot(this.direction),a=Ln.dot(Ln)-i*i,r=e.radius*e.radius;if(a>r)return null;const o=Math.sqrt(r-a),s=i-o,l=i+o;return l<0?null:s<0?this.at(l,t):this.at(s,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,a,r,o,s,l;const c=1/this.direction.x,f=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,a=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,a=(e.min.x-h.x)*c),f>=0?(r=(e.min.y-h.y)*f,o=(e.max.y-h.y)*f):(r=(e.max.y-h.y)*f,o=(e.min.y-h.y)*f),i>o||r>a||((r>i||isNaN(i))&&(i=r),(o<a||isNaN(a))&&(a=o),d>=0?(s=(e.min.z-h.z)*d,l=(e.max.z-h.z)*d):(s=(e.max.z-h.z)*d,l=(e.min.z-h.z)*d),i>l||s>a)||((s>i||i!==i)&&(i=s),(l<a||a!==a)&&(a=l),a<0)?null:this.at(i>=0?i:a,t)}intersectsBox(e){return this.intersectBox(e,Ln)!==null}intersectTriangle(e,t,i,a,r){yo.subVectors(t,e),ir.subVectors(i,e),Mo.crossVectors(yo,ir);let o=this.direction.dot(Mo),s;if(o>0){if(a)return null;s=1}else if(o<0)s=-1,o=-o;else return null;ei.subVectors(this.origin,e);const l=s*this.direction.dot(ir.crossVectors(ei,ir));if(l<0)return null;const c=s*this.direction.dot(yo.cross(ei));if(c<0||l+c>o)return null;const f=-s*ei.dot(Mo);return f<0?null:this.at(f/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class yt{constructor(e,t,i,a,r,o,s,l,c,f,d,h,p,g,x,m){yt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,a,r,o,s,l,c,f,d,h,p,g,x,m)}set(e,t,i,a,r,o,s,l,c,f,d,h,p,g,x,m){const u=this.elements;return u[0]=e,u[4]=t,u[8]=i,u[12]=a,u[1]=r,u[5]=o,u[9]=s,u[13]=l,u[2]=c,u[6]=f,u[10]=d,u[14]=h,u[3]=p,u[7]=g,u[11]=x,u[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new yt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,a=1/ki.setFromMatrixColumn(e,0).length(),r=1/ki.setFromMatrixColumn(e,1).length(),o=1/ki.setFromMatrixColumn(e,2).length();return t[0]=i[0]*a,t[1]=i[1]*a,t[2]=i[2]*a,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,a=e.y,r=e.z,o=Math.cos(i),s=Math.sin(i),l=Math.cos(a),c=Math.sin(a),f=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){const h=o*f,p=o*d,g=s*f,x=s*d;t[0]=l*f,t[4]=-l*d,t[8]=c,t[1]=p+g*c,t[5]=h-x*c,t[9]=-s*l,t[2]=x-h*c,t[6]=g+p*c,t[10]=o*l}else if(e.order==="YXZ"){const h=l*f,p=l*d,g=c*f,x=c*d;t[0]=h+x*s,t[4]=g*s-p,t[8]=o*c,t[1]=o*d,t[5]=o*f,t[9]=-s,t[2]=p*s-g,t[6]=x+h*s,t[10]=o*l}else if(e.order==="ZXY"){const h=l*f,p=l*d,g=c*f,x=c*d;t[0]=h-x*s,t[4]=-o*d,t[8]=g+p*s,t[1]=p+g*s,t[5]=o*f,t[9]=x-h*s,t[2]=-o*c,t[6]=s,t[10]=o*l}else if(e.order==="ZYX"){const h=o*f,p=o*d,g=s*f,x=s*d;t[0]=l*f,t[4]=g*c-p,t[8]=h*c+x,t[1]=l*d,t[5]=x*c+h,t[9]=p*c-g,t[2]=-c,t[6]=s*l,t[10]=o*l}else if(e.order==="YZX"){const h=o*l,p=o*c,g=s*l,x=s*c;t[0]=l*f,t[4]=x-h*d,t[8]=g*d+p,t[1]=d,t[5]=o*f,t[9]=-s*f,t[2]=-c*f,t[6]=p*d+g,t[10]=h-x*d}else if(e.order==="XZY"){const h=o*l,p=o*c,g=s*l,x=s*c;t[0]=l*f,t[4]=-d,t[8]=c*f,t[1]=h*d+x,t[5]=o*f,t[9]=p*d-g,t[2]=g*d-p,t[6]=s*f,t[10]=x*d+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(zd,e,Od)}lookAt(e,t,i){const a=this.elements;return nn.subVectors(e,t),nn.lengthSq()===0&&(nn.z=1),nn.normalize(),ti.crossVectors(i,nn),ti.lengthSq()===0&&(Math.abs(i.z)===1?nn.x+=1e-4:nn.z+=1e-4,nn.normalize(),ti.crossVectors(i,nn)),ti.normalize(),ar.crossVectors(nn,ti),a[0]=ti.x,a[4]=ar.x,a[8]=nn.x,a[1]=ti.y,a[5]=ar.y,a[9]=nn.y,a[2]=ti.z,a[6]=ar.z,a[10]=nn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,a=t.elements,r=this.elements,o=i[0],s=i[4],l=i[8],c=i[12],f=i[1],d=i[5],h=i[9],p=i[13],g=i[2],x=i[6],m=i[10],u=i[14],M=i[3],S=i[7],v=i[11],T=i[15],w=a[0],E=a[4],C=a[8],y=a[12],_=a[1],P=a[5],I=a[9],F=a[13],X=a[2],q=a[6],B=a[10],K=a[14],H=a[3],se=a[7],ue=a[11],de=a[15];return r[0]=o*w+s*_+l*X+c*H,r[4]=o*E+s*P+l*q+c*se,r[8]=o*C+s*I+l*B+c*ue,r[12]=o*y+s*F+l*K+c*de,r[1]=f*w+d*_+h*X+p*H,r[5]=f*E+d*P+h*q+p*se,r[9]=f*C+d*I+h*B+p*ue,r[13]=f*y+d*F+h*K+p*de,r[2]=g*w+x*_+m*X+u*H,r[6]=g*E+x*P+m*q+u*se,r[10]=g*C+x*I+m*B+u*ue,r[14]=g*y+x*F+m*K+u*de,r[3]=M*w+S*_+v*X+T*H,r[7]=M*E+S*P+v*q+T*se,r[11]=M*C+S*I+v*B+T*ue,r[15]=M*y+S*F+v*K+T*de,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],a=e[8],r=e[12],o=e[1],s=e[5],l=e[9],c=e[13],f=e[2],d=e[6],h=e[10],p=e[14],g=e[3],x=e[7],m=e[11],u=e[15];return g*(+r*l*d-a*c*d-r*s*h+i*c*h+a*s*p-i*l*p)+x*(+t*l*p-t*c*h+r*o*h-a*o*p+a*c*f-r*l*f)+m*(+t*c*d-t*s*p-r*o*d+i*o*p+r*s*f-i*c*f)+u*(-a*s*f-t*l*d+t*s*h+a*o*d-i*o*h+i*l*f)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const a=this.elements;return e.isVector3?(a[12]=e.x,a[13]=e.y,a[14]=e.z):(a[12]=e,a[13]=t,a[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],a=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],f=e[8],d=e[9],h=e[10],p=e[11],g=e[12],x=e[13],m=e[14],u=e[15],M=d*m*c-x*h*c+x*l*p-s*m*p-d*l*u+s*h*u,S=g*h*c-f*m*c-g*l*p+o*m*p+f*l*u-o*h*u,v=f*x*c-g*d*c+g*s*p-o*x*p-f*s*u+o*d*u,T=g*d*l-f*x*l-g*s*h+o*x*h+f*s*m-o*d*m,w=t*M+i*S+a*v+r*T;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const E=1/w;return e[0]=M*E,e[1]=(x*h*r-d*m*r-x*a*p+i*m*p+d*a*u-i*h*u)*E,e[2]=(s*m*r-x*l*r+x*a*c-i*m*c-s*a*u+i*l*u)*E,e[3]=(d*l*r-s*h*r-d*a*c+i*h*c+s*a*p-i*l*p)*E,e[4]=S*E,e[5]=(f*m*r-g*h*r+g*a*p-t*m*p-f*a*u+t*h*u)*E,e[6]=(g*l*r-o*m*r-g*a*c+t*m*c+o*a*u-t*l*u)*E,e[7]=(o*h*r-f*l*r+f*a*c-t*h*c-o*a*p+t*l*p)*E,e[8]=v*E,e[9]=(g*d*r-f*x*r-g*i*p+t*x*p+f*i*u-t*d*u)*E,e[10]=(o*x*r-g*s*r+g*i*c-t*x*c-o*i*u+t*s*u)*E,e[11]=(f*s*r-o*d*r-f*i*c+t*d*c+o*i*p-t*s*p)*E,e[12]=T*E,e[13]=(f*x*a-g*d*a+g*i*h-t*x*h-f*i*m+t*d*m)*E,e[14]=(g*s*a-o*x*a-g*i*l+t*x*l+o*i*m-t*s*m)*E,e[15]=(o*d*a-f*s*a+f*i*l-t*d*l-o*i*h+t*s*h)*E,this}scale(e){const t=this.elements,i=e.x,a=e.y,r=e.z;return t[0]*=i,t[4]*=a,t[8]*=r,t[1]*=i,t[5]*=a,t[9]*=r,t[2]*=i,t[6]*=a,t[10]*=r,t[3]*=i,t[7]*=a,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],a=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,a))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),a=Math.sin(t),r=1-i,o=e.x,s=e.y,l=e.z,c=r*o,f=r*s;return this.set(c*o+i,c*s-a*l,c*l+a*s,0,c*s+a*l,f*s+i,f*l-a*o,0,c*l-a*s,f*l+a*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,a,r,o){return this.set(1,i,r,0,e,1,o,0,t,a,1,0,0,0,0,1),this}compose(e,t,i){const a=this.elements,r=t._x,o=t._y,s=t._z,l=t._w,c=r+r,f=o+o,d=s+s,h=r*c,p=r*f,g=r*d,x=o*f,m=o*d,u=s*d,M=l*c,S=l*f,v=l*d,T=i.x,w=i.y,E=i.z;return a[0]=(1-(x+u))*T,a[1]=(p+v)*T,a[2]=(g-S)*T,a[3]=0,a[4]=(p-v)*w,a[5]=(1-(h+u))*w,a[6]=(m+M)*w,a[7]=0,a[8]=(g+S)*E,a[9]=(m-M)*E,a[10]=(1-(h+x))*E,a[11]=0,a[12]=e.x,a[13]=e.y,a[14]=e.z,a[15]=1,this}decompose(e,t,i){const a=this.elements;let r=ki.set(a[0],a[1],a[2]).length();const o=ki.set(a[4],a[5],a[6]).length(),s=ki.set(a[8],a[9],a[10]).length();this.determinant()<0&&(r=-r),e.x=a[12],e.y=a[13],e.z=a[14],_n.copy(this);const c=1/r,f=1/o,d=1/s;return _n.elements[0]*=c,_n.elements[1]*=c,_n.elements[2]*=c,_n.elements[4]*=f,_n.elements[5]*=f,_n.elements[6]*=f,_n.elements[8]*=d,_n.elements[9]*=d,_n.elements[10]*=d,t.setFromRotationMatrix(_n),i.x=r,i.y=o,i.z=s,this}makePerspective(e,t,i,a,r,o,s=kn){const l=this.elements,c=2*r/(t-e),f=2*r/(i-a),d=(t+e)/(t-e),h=(i+a)/(i-a);let p,g;if(s===kn)p=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(s===qr)p=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+s);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=f,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,a,r,o,s=kn){const l=this.elements,c=1/(t-e),f=1/(i-a),d=1/(o-r),h=(t+e)*c,p=(i+a)*f;let g,x;if(s===kn)g=(o+r)*d,x=-2*d;else if(s===qr)g=r*d,x=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+s);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*f,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let a=0;a<16;a++)if(t[a]!==i[a])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const ki=new D,_n=new yt,zd=new D(0,0,0),Od=new D(1,1,1),ti=new D,ar=new D,nn=new D,El=new yt,Cl=new Yn;class Zn{constructor(e=0,t=0,i=0,a=Zn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=a}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,a=this._order){return this._x=e,this._y=t,this._z=i,this._order=a,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const a=e.elements,r=a[0],o=a[4],s=a[8],l=a[1],c=a[5],f=a[9],d=a[2],h=a[6],p=a[10];switch(t){case"XYZ":this._y=Math.asin(qt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-f,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-qt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(s,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(qt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-qt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(qt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-f,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(s,p));break;case"XZY":this._z=Math.asin(-qt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(s,r)):(this._x=Math.atan2(-f,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return El.makeRotationFromQuaternion(e),this.setFromRotationMatrix(El,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Cl.setFromEuler(this),this.setFromQuaternion(Cl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Zn.DEFAULT_ORDER="XYZ";class js{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Bd=0;const Pl=new D,Vi=new Yn,Nn=new yt,rr=new D,Ea=new D,kd=new D,Vd=new Yn,Rl=new D(1,0,0),Dl=new D(0,1,0),Ll=new D(0,0,1),Nl={type:"added"},Wd={type:"removed"},Wi={type:"childadded",child:null},So={type:"childremoved",child:null};class Nt extends Li{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Bd++}),this.uuid=Za(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Nt.DEFAULT_UP.clone();const e=new D,t=new Zn,i=new Yn,a=new D(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:a},modelViewMatrix:{value:new yt},normalMatrix:{value:new at}}),this.matrix=new yt,this.matrixWorld=new yt,this.matrixAutoUpdate=Nt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Nt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new js,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Vi.setFromAxisAngle(e,t),this.quaternion.multiply(Vi),this}rotateOnWorldAxis(e,t){return Vi.setFromAxisAngle(e,t),this.quaternion.premultiply(Vi),this}rotateX(e){return this.rotateOnAxis(Rl,e)}rotateY(e){return this.rotateOnAxis(Dl,e)}rotateZ(e){return this.rotateOnAxis(Ll,e)}translateOnAxis(e,t){return Pl.copy(e).applyQuaternion(this.quaternion),this.position.add(Pl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Rl,e)}translateY(e){return this.translateOnAxis(Dl,e)}translateZ(e){return this.translateOnAxis(Ll,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Nn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?rr.copy(e):rr.set(e,t,i);const a=this.parent;this.updateWorldMatrix(!0,!1),Ea.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Nn.lookAt(Ea,rr,this.up):Nn.lookAt(rr,Ea,this.up),this.quaternion.setFromRotationMatrix(Nn),a&&(Nn.extractRotation(a.matrixWorld),Vi.setFromRotationMatrix(Nn),this.quaternion.premultiply(Vi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Nl),Wi.child=e,this.dispatchEvent(Wi),Wi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Wd),So.child=e,this.dispatchEvent(So),So.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Nn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Nn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Nn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Nl),Wi.child=e,this.dispatchEvent(Wi),Wi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,a=this.children.length;i<a;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const a=this.children;for(let r=0,o=a.length;r<o;r++)a[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ea,e,kd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ea,Vd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,a=t.length;i<a;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,a=t.length;i<a;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,a=t.length;i<a;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const a=this.children;for(let r=0,o=a.length;r<o;r++)a[r].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const a={};a.uuid=this.uuid,a.type=this.type,this.name!==""&&(a.name=this.name),this.castShadow===!0&&(a.castShadow=!0),this.receiveShadow===!0&&(a.receiveShadow=!0),this.visible===!1&&(a.visible=!1),this.frustumCulled===!1&&(a.frustumCulled=!1),this.renderOrder!==0&&(a.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(a.userData=this.userData),a.layers=this.layers.mask,a.matrix=this.matrix.toArray(),a.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(a.matrixAutoUpdate=!1),this.isInstancedMesh&&(a.type="InstancedMesh",a.count=this.count,a.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(a.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(a.type="BatchedMesh",a.perObjectFrustumCulled=this.perObjectFrustumCulled,a.sortObjects=this.sortObjects,a.drawRanges=this._drawRanges,a.reservedRanges=this._reservedRanges,a.visibility=this._visibility,a.active=this._active,a.bounds=this._bounds.map(s=>({boxInitialized:s.boxInitialized,boxMin:s.box.min.toArray(),boxMax:s.box.max.toArray(),sphereInitialized:s.sphereInitialized,sphereRadius:s.sphere.radius,sphereCenter:s.sphere.center.toArray()})),a.maxInstanceCount=this._maxInstanceCount,a.maxVertexCount=this._maxVertexCount,a.maxIndexCount=this._maxIndexCount,a.geometryInitialized=this._geometryInitialized,a.geometryCount=this._geometryCount,a.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(a.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(a.boundingSphere={center:a.boundingSphere.center.toArray(),radius:a.boundingSphere.radius}),this.boundingBox!==null&&(a.boundingBox={min:a.boundingBox.min.toArray(),max:a.boundingBox.max.toArray()}));function r(s,l){return s[l.uuid]===void 0&&(s[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?a.background=this.background.toJSON():this.background.isTexture&&(a.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(a.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){a.geometry=r(e.geometries,this.geometry);const s=this.geometry.parameters;if(s!==void 0&&s.shapes!==void 0){const l=s.shapes;if(Array.isArray(l))for(let c=0,f=l.length;c<f;c++){const d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(a.bindMode=this.bindMode,a.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),a.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const s=[];for(let l=0,c=this.material.length;l<c;l++)s.push(r(e.materials,this.material[l]));a.material=s}else a.material=r(e.materials,this.material);if(this.children.length>0){a.children=[];for(let s=0;s<this.children.length;s++)a.children.push(this.children[s].toJSON(e).object)}if(this.animations.length>0){a.animations=[];for(let s=0;s<this.animations.length;s++){const l=this.animations[s];a.animations.push(r(e.animations,l))}}if(t){const s=o(e.geometries),l=o(e.materials),c=o(e.textures),f=o(e.images),d=o(e.shapes),h=o(e.skeletons),p=o(e.animations),g=o(e.nodes);s.length>0&&(i.geometries=s),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),f.length>0&&(i.images=f),d.length>0&&(i.shapes=d),h.length>0&&(i.skeletons=h),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=a,i;function o(s){const l=[];for(const c in s){const f=s[c];delete f.metadata,l.push(f)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const a=e.children[i];this.add(a.clone())}return this}}Nt.DEFAULT_UP=new D(0,1,0);Nt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Nt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const yn=new D,Fn=new D,wo=new D,In=new D,Gi=new D,Hi=new D,Fl=new D,bo=new D,To=new D,Ao=new D,Eo=new wt,Co=new wt,Po=new wt;class Mn{constructor(e=new D,t=new D,i=new D){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,a){a.subVectors(i,t),yn.subVectors(e,t),a.cross(yn);const r=a.lengthSq();return r>0?a.multiplyScalar(1/Math.sqrt(r)):a.set(0,0,0)}static getBarycoord(e,t,i,a,r){yn.subVectors(a,t),Fn.subVectors(i,t),wo.subVectors(e,t);const o=yn.dot(yn),s=yn.dot(Fn),l=yn.dot(wo),c=Fn.dot(Fn),f=Fn.dot(wo),d=o*c-s*s;if(d===0)return r.set(0,0,0),null;const h=1/d,p=(c*l-s*f)*h,g=(o*f-s*l)*h;return r.set(1-p-g,g,p)}static containsPoint(e,t,i,a){return this.getBarycoord(e,t,i,a,In)===null?!1:In.x>=0&&In.y>=0&&In.x+In.y<=1}static getInterpolation(e,t,i,a,r,o,s,l){return this.getBarycoord(e,t,i,a,In)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,In.x),l.addScaledVector(o,In.y),l.addScaledVector(s,In.z),l)}static getInterpolatedAttribute(e,t,i,a,r,o){return Eo.setScalar(0),Co.setScalar(0),Po.setScalar(0),Eo.fromBufferAttribute(e,t),Co.fromBufferAttribute(e,i),Po.fromBufferAttribute(e,a),o.setScalar(0),o.addScaledVector(Eo,r.x),o.addScaledVector(Co,r.y),o.addScaledVector(Po,r.z),o}static isFrontFacing(e,t,i,a){return yn.subVectors(i,t),Fn.subVectors(e,t),yn.cross(Fn).dot(a)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,a){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[a]),this}setFromAttributeAndIndices(e,t,i,a){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,a),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return yn.subVectors(this.c,this.b),Fn.subVectors(this.a,this.b),yn.cross(Fn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Mn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Mn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,a,r){return Mn.getInterpolation(e,this.a,this.b,this.c,t,i,a,r)}containsPoint(e){return Mn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Mn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,a=this.b,r=this.c;let o,s;Gi.subVectors(a,i),Hi.subVectors(r,i),bo.subVectors(e,i);const l=Gi.dot(bo),c=Hi.dot(bo);if(l<=0&&c<=0)return t.copy(i);To.subVectors(e,a);const f=Gi.dot(To),d=Hi.dot(To);if(f>=0&&d<=f)return t.copy(a);const h=l*d-f*c;if(h<=0&&l>=0&&f<=0)return o=l/(l-f),t.copy(i).addScaledVector(Gi,o);Ao.subVectors(e,r);const p=Gi.dot(Ao),g=Hi.dot(Ao);if(g>=0&&p<=g)return t.copy(r);const x=p*c-l*g;if(x<=0&&c>=0&&g<=0)return s=c/(c-g),t.copy(i).addScaledVector(Hi,s);const m=f*g-p*d;if(m<=0&&d-f>=0&&p-g>=0)return Fl.subVectors(r,a),s=(d-f)/(d-f+(p-g)),t.copy(a).addScaledVector(Fl,s);const u=1/(m+x+h);return o=x*u,s=h*u,t.copy(i).addScaledVector(Gi,o).addScaledVector(Hi,s)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const xu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ni={h:0,s:0,l:0},or={h:0,s:0,l:0};function Ro(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class lt{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const a=e;a&&a.isColor?this.copy(a):typeof a=="number"?this.setHex(a):typeof a=="string"&&this.setStyle(a)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=cn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ht.toWorkingColorSpace(this,t),this}setRGB(e,t,i,a=ht.workingColorSpace){return this.r=e,this.g=t,this.b=i,ht.toWorkingColorSpace(this,a),this}setHSL(e,t,i,a=ht.workingColorSpace){if(e=Td(e,1),t=qt(t,0,1),i=qt(i,0,1),t===0)this.r=this.g=this.b=i;else{const r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Ro(o,r,e+1/3),this.g=Ro(o,r,e),this.b=Ro(o,r,e-1/3)}return ht.toWorkingColorSpace(this,a),this}setStyle(e,t=cn){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let a;if(a=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const o=a[1],s=a[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(a=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=a[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=cn){const i=xu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Gn(e.r),this.g=Gn(e.g),this.b=Gn(e.b),this}copyLinearToSRGB(e){return this.r=sa(e.r),this.g=sa(e.g),this.b=sa(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=cn){return ht.fromWorkingColorSpace(Gt.copy(this),e),Math.round(qt(Gt.r*255,0,255))*65536+Math.round(qt(Gt.g*255,0,255))*256+Math.round(qt(Gt.b*255,0,255))}getHexString(e=cn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ht.workingColorSpace){ht.fromWorkingColorSpace(Gt.copy(this),t);const i=Gt.r,a=Gt.g,r=Gt.b,o=Math.max(i,a,r),s=Math.min(i,a,r);let l,c;const f=(s+o)/2;if(s===o)l=0,c=0;else{const d=o-s;switch(c=f<=.5?d/(o+s):d/(2-o-s),o){case i:l=(a-r)/d+(a<r?6:0);break;case a:l=(r-i)/d+2;break;case r:l=(i-a)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=f,e}getRGB(e,t=ht.workingColorSpace){return ht.fromWorkingColorSpace(Gt.copy(this),t),e.r=Gt.r,e.g=Gt.g,e.b=Gt.b,e}getStyle(e=cn){ht.fromWorkingColorSpace(Gt.copy(this),e);const t=Gt.r,i=Gt.g,a=Gt.b;return e!==cn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${a.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(a*255)})`}offsetHSL(e,t,i){return this.getHSL(ni),this.setHSL(ni.h+e,ni.s+t,ni.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ni),e.getHSL(or);const i=fo(ni.h,or.h,t),a=fo(ni.s,or.s,t),r=fo(ni.l,or.l,t);return this.setHSL(i,a,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,a=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*a,this.g=r[1]*t+r[4]*i+r[7]*a,this.b=r[2]*t+r[5]*i+r[8]*a,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Gt=new lt;lt.NAMES=xu;let Gd=0;class ja extends Li{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Gd++}),this.uuid=Za(),this.name="",this.blending=Yt,this.side=Xn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Zo,this.blendDst=jo,this.blendEquation=bi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new lt(0,0,0),this.blendAlpha=0,this.depthFunc=ca,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=gl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ii,this.stencilZFail=Ii,this.stencilZPass=Ii,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const a=this[t];if(a===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}a&&a.isColor?a.set(i):a&&a.isVector3&&i&&i.isVector3?a.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Yt&&(i.blending=this.blending),this.side!==Xn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Zo&&(i.blendSrc=this.blendSrc),this.blendDst!==jo&&(i.blendDst=this.blendDst),this.blendEquation!==bi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==ca&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==gl&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ii&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ii&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ii&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function a(r){const o=[];for(const s in r){const l=r[s];delete l.metadata,o.push(l)}return o}if(t){const r=a(e.textures),o=a(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const a=t.length;i=new Array(a);for(let r=0;r!==a;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class $s extends ja{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new lt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Zn,this.combine=Jc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Rt=new D,sr=new Le;class De{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=xl,this.updateRanges=[],this.gpuType=Cn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let a=0,r=this.itemSize;a<r;a++)this.array[e+a]=t.array[i+a];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)sr.fromBufferAttribute(this,t),sr.applyMatrix3(e),this.setXY(t,sr.x,sr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix3(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix4(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyNormalMatrix(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.transformDirection(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=ba(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Kt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ba(t,this.array)),t}setX(e,t){return this.normalized&&(t=Kt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ba(t,this.array)),t}setY(e,t){return this.normalized&&(t=Kt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ba(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Kt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ba(t,this.array)),t}setW(e,t){return this.normalized&&(t=Kt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Kt(t,this.array),i=Kt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,a){return e*=this.itemSize,this.normalized&&(t=Kt(t,this.array),i=Kt(i,this.array),a=Kt(a,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=a,this}setXYZW(e,t,i,a,r){return e*=this.itemSize,this.normalized&&(t=Kt(t,this.array),i=Kt(i,this.array),a=Kt(a,this.array),r=Kt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=a,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==xl&&(e.usage=this.usage),e}}class _u extends De{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class yu extends De{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class ct extends De{constructor(e,t,i){super(new Float32Array(e),t,i)}}let Hd=0;const hn=new yt,Do=new Nt,Xi=new D,an=new Ni,Ca=new Ni,Ot=new D;class st extends Li{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Hd++}),this.uuid=Za(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(mu(e)?yu:_u)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const r=new at().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}const a=this.attributes.tangent;return a!==void 0&&(a.transformDirection(e),a.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return hn.makeRotationFromQuaternion(e),this.applyMatrix4(hn),this}rotateX(e){return hn.makeRotationX(e),this.applyMatrix4(hn),this}rotateY(e){return hn.makeRotationY(e),this.applyMatrix4(hn),this}rotateZ(e){return hn.makeRotationZ(e),this.applyMatrix4(hn),this}translate(e,t,i){return hn.makeTranslation(e,t,i),this.applyMatrix4(hn),this}scale(e,t,i){return hn.makeScale(e,t,i),this.applyMatrix4(hn),this}lookAt(e){return Do.lookAt(e),Do.updateMatrix(),this.applyMatrix4(Do.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Xi).negate(),this.translate(Xi.x,Xi.y,Xi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let a=0,r=e.length;a<r;a++){const o=e[a];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new ct(i,3))}else{for(let i=0,a=t.count;i<a;i++){const r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ni);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,a=t.length;i<a;i++){const r=t[i];an.setFromBufferAttribute(r),this.morphTargetsRelative?(Ot.addVectors(this.boundingBox.min,an.min),this.boundingBox.expandByPoint(Ot),Ot.addVectors(this.boundingBox.max,an.max),this.boundingBox.expandByPoint(Ot)):(this.boundingBox.expandByPoint(an.min),this.boundingBox.expandByPoint(an.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xa);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){const i=this.boundingSphere.center;if(an.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const s=t[r];Ca.setFromBufferAttribute(s),this.morphTargetsRelative?(Ot.addVectors(an.min,Ca.min),an.expandByPoint(Ot),Ot.addVectors(an.max,Ca.max),an.expandByPoint(Ot)):(an.expandByPoint(Ca.min),an.expandByPoint(Ca.max))}an.getCenter(i);let a=0;for(let r=0,o=e.count;r<o;r++)Ot.fromBufferAttribute(e,r),a=Math.max(a,i.distanceToSquared(Ot));if(t)for(let r=0,o=t.length;r<o;r++){const s=t[r],l=this.morphTargetsRelative;for(let c=0,f=s.count;c<f;c++)Ot.fromBufferAttribute(s,c),l&&(Xi.fromBufferAttribute(e,c),Ot.add(Xi)),a=Math.max(a,i.distanceToSquared(Ot))}this.boundingSphere.radius=Math.sqrt(a),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,a=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new De(new Float32Array(4*i.count),4));const o=this.getAttribute("tangent"),s=[],l=[];for(let C=0;C<i.count;C++)s[C]=new D,l[C]=new D;const c=new D,f=new D,d=new D,h=new Le,p=new Le,g=new Le,x=new D,m=new D;function u(C,y,_){c.fromBufferAttribute(i,C),f.fromBufferAttribute(i,y),d.fromBufferAttribute(i,_),h.fromBufferAttribute(r,C),p.fromBufferAttribute(r,y),g.fromBufferAttribute(r,_),f.sub(c),d.sub(c),p.sub(h),g.sub(h);const P=1/(p.x*g.y-g.x*p.y);isFinite(P)&&(x.copy(f).multiplyScalar(g.y).addScaledVector(d,-p.y).multiplyScalar(P),m.copy(d).multiplyScalar(p.x).addScaledVector(f,-g.x).multiplyScalar(P),s[C].add(x),s[y].add(x),s[_].add(x),l[C].add(m),l[y].add(m),l[_].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let C=0,y=M.length;C<y;++C){const _=M[C],P=_.start,I=_.count;for(let F=P,X=P+I;F<X;F+=3)u(e.getX(F+0),e.getX(F+1),e.getX(F+2))}const S=new D,v=new D,T=new D,w=new D;function E(C){T.fromBufferAttribute(a,C),w.copy(T);const y=s[C];S.copy(y),S.sub(T.multiplyScalar(T.dot(y))).normalize(),v.crossVectors(w,y);const P=v.dot(l[C])<0?-1:1;o.setXYZW(C,S.x,S.y,S.z,P)}for(let C=0,y=M.length;C<y;++C){const _=M[C],P=_.start,I=_.count;for(let F=P,X=P+I;F<X;F+=3)E(e.getX(F+0)),E(e.getX(F+1)),E(e.getX(F+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new De(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,p=i.count;h<p;h++)i.setXYZ(h,0,0,0);const a=new D,r=new D,o=new D,s=new D,l=new D,c=new D,f=new D,d=new D;if(e)for(let h=0,p=e.count;h<p;h+=3){const g=e.getX(h+0),x=e.getX(h+1),m=e.getX(h+2);a.fromBufferAttribute(t,g),r.fromBufferAttribute(t,x),o.fromBufferAttribute(t,m),f.subVectors(o,r),d.subVectors(a,r),f.cross(d),s.fromBufferAttribute(i,g),l.fromBufferAttribute(i,x),c.fromBufferAttribute(i,m),s.add(f),l.add(f),c.add(f),i.setXYZ(g,s.x,s.y,s.z),i.setXYZ(x,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,p=t.count;h<p;h+=3)a.fromBufferAttribute(t,h+0),r.fromBufferAttribute(t,h+1),o.fromBufferAttribute(t,h+2),f.subVectors(o,r),d.subVectors(a,r),f.cross(d),i.setXYZ(h+0,f.x,f.y,f.z),i.setXYZ(h+1,f.x,f.y,f.z),i.setXYZ(h+2,f.x,f.y,f.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Ot.fromBufferAttribute(e,t),Ot.normalize(),e.setXYZ(t,Ot.x,Ot.y,Ot.z)}toNonIndexed(){function e(s,l){const c=s.array,f=s.itemSize,d=s.normalized,h=new c.constructor(l.length*f);let p=0,g=0;for(let x=0,m=l.length;x<m;x++){s.isInterleavedBufferAttribute?p=l[x]*s.data.stride+s.offset:p=l[x]*f;for(let u=0;u<f;u++)h[g++]=c[p++]}return new De(h,f,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new st,i=this.index.array,a=this.attributes;for(const s in a){const l=a[s],c=e(l,i);t.setAttribute(s,c)}const r=this.morphAttributes;for(const s in r){const l=[],c=r[s];for(let f=0,d=c.length;f<d;f++){const h=c[f],p=e(h,i);l.push(p)}t.morphAttributes[s]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let s=0,l=o.length;s<l;s++){const c=o[s];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const a={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],f=[];for(let d=0,h=c.length;d<h;d++){const p=c[d];f.push(p.toJSON(e.data))}f.length>0&&(a[l]=f,r=!0)}r&&(e.data.morphAttributes=a,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const s=this.boundingSphere;return s!==null&&(e.data.boundingSphere={center:s.center.toArray(),radius:s.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const a=e.attributes;for(const c in a){const f=a[c];this.setAttribute(c,f.clone(t))}const r=e.morphAttributes;for(const c in r){const f=[],d=r[c];for(let h=0,p=d.length;h<p;h++)f.push(d[h].clone(t));this.morphAttributes[c]=f}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,f=o.length;c<f;c++){const d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}const s=e.boundingBox;s!==null&&(this.boundingBox=s.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Il=new yt,vi=new eo,lr=new xa,Ul=new D,cr=new D,ur=new D,dr=new D,Lo=new D,hr=new D,zl=new D,fr=new D;class ut extends Nt{constructor(e=new st,t=new $s){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const a=t[i[0]];if(a!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=a.length;r<o;r++){const s=a[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=r}}}}getVertexPosition(e,t){const i=this.geometry,a=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(a,e);const s=this.morphTargetInfluences;if(r&&s){hr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const f=s[l],d=r[l];f!==0&&(Lo.fromBufferAttribute(d,e),o?hr.addScaledVector(Lo,f):hr.addScaledVector(Lo.sub(t),f))}t.add(hr)}return t}raycast(e,t){const i=this.geometry,a=this.material,r=this.matrixWorld;a!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),lr.copy(i.boundingSphere),lr.applyMatrix4(r),vi.copy(e.ray).recast(e.near),!(lr.containsPoint(vi.origin)===!1&&(vi.intersectSphere(lr,Ul)===null||vi.origin.distanceToSquared(Ul)>(e.far-e.near)**2))&&(Il.copy(r).invert(),vi.copy(e.ray).applyMatrix4(Il),!(i.boundingBox!==null&&vi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,vi)))}_computeIntersections(e,t,i){let a;const r=this.geometry,o=this.material,s=r.index,l=r.attributes.position,c=r.attributes.uv,f=r.attributes.uv1,d=r.attributes.normal,h=r.groups,p=r.drawRange;if(s!==null)if(Array.isArray(o))for(let g=0,x=h.length;g<x;g++){const m=h[g],u=o[m.materialIndex],M=Math.max(m.start,p.start),S=Math.min(s.count,Math.min(m.start+m.count,p.start+p.count));for(let v=M,T=S;v<T;v+=3){const w=s.getX(v),E=s.getX(v+1),C=s.getX(v+2);a=pr(this,u,e,i,c,f,d,w,E,C),a&&(a.faceIndex=Math.floor(v/3),a.face.materialIndex=m.materialIndex,t.push(a))}}else{const g=Math.max(0,p.start),x=Math.min(s.count,p.start+p.count);for(let m=g,u=x;m<u;m+=3){const M=s.getX(m),S=s.getX(m+1),v=s.getX(m+2);a=pr(this,o,e,i,c,f,d,M,S,v),a&&(a.faceIndex=Math.floor(m/3),t.push(a))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,x=h.length;g<x;g++){const m=h[g],u=o[m.materialIndex],M=Math.max(m.start,p.start),S=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let v=M,T=S;v<T;v+=3){const w=v,E=v+1,C=v+2;a=pr(this,u,e,i,c,f,d,w,E,C),a&&(a.faceIndex=Math.floor(v/3),a.face.materialIndex=m.materialIndex,t.push(a))}}else{const g=Math.max(0,p.start),x=Math.min(l.count,p.start+p.count);for(let m=g,u=x;m<u;m+=3){const M=m,S=m+1,v=m+2;a=pr(this,o,e,i,c,f,d,M,S,v),a&&(a.faceIndex=Math.floor(m/3),t.push(a))}}}}function Xd(n,e,t,i,a,r,o,s){let l;if(e.side===Lt?l=i.intersectTriangle(o,r,a,!0,s):l=i.intersectTriangle(a,r,o,e.side===Xn,s),l===null)return null;fr.copy(s),fr.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(fr);return c<t.near||c>t.far?null:{distance:c,point:fr.clone(),object:n}}function pr(n,e,t,i,a,r,o,s,l,c){n.getVertexPosition(s,cr),n.getVertexPosition(l,ur),n.getVertexPosition(c,dr);const f=Xd(n,e,t,i,cr,ur,dr,zl);if(f){const d=new D;Mn.getBarycoord(zl,cr,ur,dr,d),a&&(f.uv=Mn.getInterpolatedAttribute(a,s,l,c,d,new Le)),r&&(f.uv1=Mn.getInterpolatedAttribute(r,s,l,c,d,new Le)),o&&(f.normal=Mn.getInterpolatedAttribute(o,s,l,c,d,new D),f.normal.dot(i.direction)>0&&f.normal.multiplyScalar(-1));const h={a:s,b:l,c,normal:new D,materialIndex:0};Mn.getNormal(cr,ur,dr,h.normal),f.face=h,f.barycoord=d}return f}class $a extends st{constructor(e=1,t=1,i=1,a=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:a,heightSegments:r,depthSegments:o};const s=this;a=Math.floor(a),r=Math.floor(r),o=Math.floor(o);const l=[],c=[],f=[],d=[];let h=0,p=0;g("z","y","x",-1,-1,i,t,e,o,r,0),g("z","y","x",1,-1,i,t,-e,o,r,1),g("x","z","y",1,1,e,i,t,a,o,2),g("x","z","y",1,-1,e,i,-t,a,o,3),g("x","y","z",1,-1,e,t,i,a,r,4),g("x","y","z",-1,-1,e,t,-i,a,r,5),this.setIndex(l),this.setAttribute("position",new ct(c,3)),this.setAttribute("normal",new ct(f,3)),this.setAttribute("uv",new ct(d,2));function g(x,m,u,M,S,v,T,w,E,C,y){const _=v/E,P=T/C,I=v/2,F=T/2,X=w/2,q=E+1,B=C+1;let K=0,H=0;const se=new D;for(let ue=0;ue<B;ue++){const de=ue*P-F;for(let _e=0;_e<q;_e++){const Re=_e*_-I;se[x]=Re*M,se[m]=de*S,se[u]=X,c.push(se.x,se.y,se.z),se[x]=0,se[m]=0,se[u]=w>0?1:-1,f.push(se.x,se.y,se.z),d.push(_e/E),d.push(1-ue/C),K+=1}}for(let ue=0;ue<C;ue++)for(let de=0;de<E;de++){const _e=h+de+q*ue,Re=h+de+q*(ue+1),j=h+(de+1)+q*(ue+1),le=h+(de+1)+q*ue;l.push(_e,Re,le),l.push(Re,j,le),H+=6}s.addGroup(p,H,y),p+=H,h+=K}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new $a(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function pa(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const a=n[t][i];a&&(a.isColor||a.isMatrix3||a.isMatrix4||a.isVector2||a.isVector3||a.isVector4||a.isTexture||a.isQuaternion)?a.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=a.clone():Array.isArray(a)?e[t][i]=a.slice():e[t][i]=a}}return e}function Zt(n){const e={};for(let t=0;t<n.length;t++){const i=pa(n[t]);for(const a in i)e[a]=i[a]}return e}function qd(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Mu(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ht.workingColorSpace}const Xa={clone:pa,merge:Zt};var Yd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Zd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ke extends ja{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Yd,this.fragmentShader=Zd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=pa(e.uniforms),this.uniformsGroups=qd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const a in this.uniforms){const o=this.uniforms[a].value;o&&o.isTexture?t.uniforms[a]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[a]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[a]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[a]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[a]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[a]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[a]={type:"m4",value:o.toArray()}:t.uniforms[a]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const a in this.extensions)this.extensions[a]===!0&&(i[a]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class Su extends Nt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new yt,this.projectionMatrix=new yt,this.projectionMatrixInverse=new yt,this.coordinateSystem=kn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const ii=new D,Ol=new Le,Bl=new Le;class Qt extends Su{constructor(e=50,t=1,i=.1,a=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=a,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Ns*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Vr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ns*2*Math.atan(Math.tan(Vr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ii.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ii.x,ii.y).multiplyScalar(-e/ii.z),ii.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ii.x,ii.y).multiplyScalar(-e/ii.z)}getViewSize(e,t){return this.getViewBounds(e,Ol,Bl),t.subVectors(Bl,Ol)}setViewOffset(e,t,i,a,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=a,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Vr*.5*this.fov)/this.zoom,i=2*t,a=this.aspect*i,r=-.5*a;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*a/l,t-=o.offsetY*i/c,a*=o.width/l,i*=o.height/c}const s=this.filmOffset;s!==0&&(r+=e*s/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+a,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const qi=-90,Yi=1;class jd extends Nt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const a=new Qt(qi,Yi,e,t);a.layers=this.layers,this.add(a);const r=new Qt(qi,Yi,e,t);r.layers=this.layers,this.add(r);const o=new Qt(qi,Yi,e,t);o.layers=this.layers,this.add(o);const s=new Qt(qi,Yi,e,t);s.layers=this.layers,this.add(s);const l=new Qt(qi,Yi,e,t);l.layers=this.layers,this.add(l);const c=new Qt(qi,Yi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,a,r,o,s,l]=t;for(const c of t)this.remove(c);if(e===kn)i.up.set(0,1,0),i.lookAt(1,0,0),a.up.set(0,1,0),a.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),s.up.set(0,1,0),s.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===qr)i.up.set(0,-1,0),i.lookAt(-1,0,0),a.up.set(0,-1,0),a.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),s.up.set(0,-1,0),s.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:a}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,o,s,l,c,f]=this.children,d=e.getRenderTarget(),h=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const x=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,a),e.render(t,r),e.setRenderTarget(i,1,a),e.render(t,o),e.setRenderTarget(i,2,a),e.render(t,s),e.setRenderTarget(i,3,a),e.render(t,l),e.setRenderTarget(i,4,a),e.render(t,c),i.texture.generateMipmaps=x,e.setRenderTarget(i,5,a),e.render(t,f),e.setRenderTarget(d,h,p),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class wu extends jt{constructor(e,t,i,a,r,o,s,l,c,f){e=e!==void 0?e:[],t=t!==void 0?t:ua,super(e,t,i,a,r,o,s,l,c,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class $d extends vn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},a=[i,i,i,i,i,i];this.texture=new wu(a,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:En}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},a=new $a(5,5,5),r=new Ke({name:"CubemapFromEquirect",uniforms:pa(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Lt,blending:Wn});r.uniforms.tEquirect.value=t;const o=new ut(a,r),s=t.minFilter;return t.minFilter===Ei&&(t.minFilter=En),new jd(1,10,this).update(e,o),t.minFilter=s,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,i,a){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,a);e.setRenderTarget(r)}}const No=new D,Kd=new D,Jd=new at;class On{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,a){return this.normal.set(e,t,i),this.constant=a,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const a=No.subVectors(i,t).cross(Kd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(a,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(No),a=this.normal.dot(i);if(a===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/a;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||Jd.getNormalMatrix(e),a=this.coplanarPoint(No).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-a.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const gi=new xa,mr=new D;class Ks{constructor(e=new On,t=new On,i=new On,a=new On,r=new On,o=new On){this.planes=[e,t,i,a,r,o]}set(e,t,i,a,r,o){const s=this.planes;return s[0].copy(e),s[1].copy(t),s[2].copy(i),s[3].copy(a),s[4].copy(r),s[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=kn){const i=this.planes,a=e.elements,r=a[0],o=a[1],s=a[2],l=a[3],c=a[4],f=a[5],d=a[6],h=a[7],p=a[8],g=a[9],x=a[10],m=a[11],u=a[12],M=a[13],S=a[14],v=a[15];if(i[0].setComponents(l-r,h-c,m-p,v-u).normalize(),i[1].setComponents(l+r,h+c,m+p,v+u).normalize(),i[2].setComponents(l+o,h+f,m+g,v+M).normalize(),i[3].setComponents(l-o,h-f,m-g,v-M).normalize(),i[4].setComponents(l-s,h-d,m-x,v-S).normalize(),t===kn)i[5].setComponents(l+s,h+d,m+x,v+S).normalize();else if(t===qr)i[5].setComponents(s,d,x,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),gi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),gi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(gi)}intersectsSprite(e){return gi.center.set(0,0,0),gi.radius=.7071067811865476,gi.applyMatrix4(e.matrixWorld),this.intersectsSphere(gi)}intersectsSphere(e){const t=this.planes,i=e.center,a=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<a)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const a=t[i];if(mr.x=a.normal.x>0?e.max.x:e.min.x,mr.y=a.normal.y>0?e.max.y:e.min.y,mr.z=a.normal.z>0?e.max.z:e.min.z,a.distanceToPoint(mr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function bu(){let n=null,e=!1,t=null,i=null;function a(r,o){t(r,o),i=n.requestAnimationFrame(a)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(a),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Qd(n){const e=new WeakMap;function t(s,l){const c=s.array,f=s.usage,d=c.byteLength,h=n.createBuffer();n.bindBuffer(l,h),n.bufferData(l,c,f),s.onUploadCallback();let p;if(c instanceof Float32Array)p=n.FLOAT;else if(c instanceof Uint16Array)s.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=n.SHORT;else if(c instanceof Uint32Array)p=n.UNSIGNED_INT;else if(c instanceof Int32Array)p=n.INT;else if(c instanceof Int8Array)p=n.BYTE;else if(c instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:s.version,size:d}}function i(s,l,c){const f=l.array,d=l.updateRanges;if(n.bindBuffer(c,s),d.length===0)n.bufferSubData(c,0,f);else{d.sort((p,g)=>p.start-g.start);let h=0;for(let p=1;p<d.length;p++){const g=d[h],x=d[p];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++h,d[h]=x)}d.length=h+1;for(let p=0,g=d.length;p<g;p++){const x=d[p];n.bufferSubData(c,x.start*f.BYTES_PER_ELEMENT,f,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function a(s){return s.isInterleavedBufferAttribute&&(s=s.data),e.get(s)}function r(s){s.isInterleavedBufferAttribute&&(s=s.data);const l=e.get(s);l&&(n.deleteBuffer(l.buffer),e.delete(s))}function o(s,l){if(s.isInterleavedBufferAttribute&&(s=s.data),s.isGLBufferAttribute){const f=e.get(s);(!f||f.version<s.version)&&e.set(s,{buffer:s.buffer,type:s.type,bytesPerElement:s.elementSize,version:s.version});return}const c=e.get(s);if(c===void 0)e.set(s,t(s,l));else if(c.version<s.version){if(c.size!==s.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,s,l),c.version=s.version}}return{get:a,remove:r,update:o}}class en extends st{constructor(e=1,t=1,i=1,a=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:a};const r=e/2,o=t/2,s=Math.floor(i),l=Math.floor(a),c=s+1,f=l+1,d=e/s,h=t/l,p=[],g=[],x=[],m=[];for(let u=0;u<f;u++){const M=u*h-o;for(let S=0;S<c;S++){const v=S*d-r;g.push(v,-M,0),x.push(0,0,1),m.push(S/s),m.push(1-u/l)}}for(let u=0;u<l;u++)for(let M=0;M<s;M++){const S=M+c*u,v=M+c*(u+1),T=M+1+c*(u+1),w=M+1+c*u;p.push(S,v,w),p.push(v,T,w)}this.setIndex(p),this.setAttribute("position",new ct(g,3)),this.setAttribute("normal",new ct(x,3)),this.setAttribute("uv",new ct(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new en(e.width,e.height,e.widthSegments,e.heightSegments)}}var eh=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,th=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,nh=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ih=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ah=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,rh=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,oh=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,sh=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,lh=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,ch=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,uh=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,dh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,hh=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,fh=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,ph=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,mh=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,vh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,gh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,xh=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,_h=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,yh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Mh=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Sh=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,wh=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,bh=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Th=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Ah=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Eh=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ch=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ph=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Rh="gl_FragColor = linearToOutputTexel( gl_FragColor );",Dh=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Lh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Nh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Fh=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ih=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Uh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,zh=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Oh=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,kh=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Vh=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Wh=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Gh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Hh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Xh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,qh=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Yh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Zh=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,jh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,$h=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Kh=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Jh=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Qh=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,ef=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,tf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,nf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,af=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,of=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,sf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,lf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,cf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,uf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,df=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,hf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,ff=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,pf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,mf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,gf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,_f=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,yf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Mf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Sf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,wf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,bf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Tf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Af=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ef=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Cf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Pf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Rf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Df=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Lf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Nf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ff=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,If=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Uf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,zf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Of=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Bf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,kf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Vf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Wf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Gf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Hf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Xf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,qf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Yf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Zf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,jf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,$f=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Kf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Jf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Qf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const e0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,t0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,n0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,i0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,a0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,r0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,o0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,s0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,l0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,c0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,u0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,d0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,h0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,f0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,p0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,m0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,v0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,g0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,x0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,_0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,y0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,M0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,S0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,w0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,b0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,T0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,A0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,E0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,C0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,P0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,R0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,D0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,L0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,N0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ot={alphahash_fragment:eh,alphahash_pars_fragment:th,alphamap_fragment:nh,alphamap_pars_fragment:ih,alphatest_fragment:ah,alphatest_pars_fragment:rh,aomap_fragment:oh,aomap_pars_fragment:sh,batching_pars_vertex:lh,batching_vertex:ch,begin_vertex:uh,beginnormal_vertex:dh,bsdfs:hh,iridescence_fragment:fh,bumpmap_pars_fragment:ph,clipping_planes_fragment:mh,clipping_planes_pars_fragment:vh,clipping_planes_pars_vertex:gh,clipping_planes_vertex:xh,color_fragment:_h,color_pars_fragment:yh,color_pars_vertex:Mh,color_vertex:Sh,common:wh,cube_uv_reflection_fragment:bh,defaultnormal_vertex:Th,displacementmap_pars_vertex:Ah,displacementmap_vertex:Eh,emissivemap_fragment:Ch,emissivemap_pars_fragment:Ph,colorspace_fragment:Rh,colorspace_pars_fragment:Dh,envmap_fragment:Lh,envmap_common_pars_fragment:Nh,envmap_pars_fragment:Fh,envmap_pars_vertex:Ih,envmap_physical_pars_fragment:qh,envmap_vertex:Uh,fog_vertex:zh,fog_pars_vertex:Oh,fog_fragment:Bh,fog_pars_fragment:kh,gradientmap_pars_fragment:Vh,lightmap_pars_fragment:Wh,lights_lambert_fragment:Gh,lights_lambert_pars_fragment:Hh,lights_pars_begin:Xh,lights_toon_fragment:Yh,lights_toon_pars_fragment:Zh,lights_phong_fragment:jh,lights_phong_pars_fragment:$h,lights_physical_fragment:Kh,lights_physical_pars_fragment:Jh,lights_fragment_begin:Qh,lights_fragment_maps:ef,lights_fragment_end:tf,logdepthbuf_fragment:nf,logdepthbuf_pars_fragment:af,logdepthbuf_pars_vertex:rf,logdepthbuf_vertex:of,map_fragment:sf,map_pars_fragment:lf,map_particle_fragment:cf,map_particle_pars_fragment:uf,metalnessmap_fragment:df,metalnessmap_pars_fragment:hf,morphinstance_vertex:ff,morphcolor_vertex:pf,morphnormal_vertex:mf,morphtarget_pars_vertex:vf,morphtarget_vertex:gf,normal_fragment_begin:xf,normal_fragment_maps:_f,normal_pars_fragment:yf,normal_pars_vertex:Mf,normal_vertex:Sf,normalmap_pars_fragment:wf,clearcoat_normal_fragment_begin:bf,clearcoat_normal_fragment_maps:Tf,clearcoat_pars_fragment:Af,iridescence_pars_fragment:Ef,opaque_fragment:Cf,packing:Pf,premultiplied_alpha_fragment:Rf,project_vertex:Df,dithering_fragment:Lf,dithering_pars_fragment:Nf,roughnessmap_fragment:Ff,roughnessmap_pars_fragment:If,shadowmap_pars_fragment:Uf,shadowmap_pars_vertex:zf,shadowmap_vertex:Of,shadowmask_pars_fragment:Bf,skinbase_vertex:kf,skinning_pars_vertex:Vf,skinning_vertex:Wf,skinnormal_vertex:Gf,specularmap_fragment:Hf,specularmap_pars_fragment:Xf,tonemapping_fragment:qf,tonemapping_pars_fragment:Yf,transmission_fragment:Zf,transmission_pars_fragment:jf,uv_pars_fragment:$f,uv_pars_vertex:Kf,uv_vertex:Jf,worldpos_vertex:Qf,background_vert:e0,background_frag:t0,backgroundCube_vert:n0,backgroundCube_frag:i0,cube_vert:a0,cube_frag:r0,depth_vert:o0,depth_frag:s0,distanceRGBA_vert:l0,distanceRGBA_frag:c0,equirect_vert:u0,equirect_frag:d0,linedashed_vert:h0,linedashed_frag:f0,meshbasic_vert:p0,meshbasic_frag:m0,meshlambert_vert:v0,meshlambert_frag:g0,meshmatcap_vert:x0,meshmatcap_frag:_0,meshnormal_vert:y0,meshnormal_frag:M0,meshphong_vert:S0,meshphong_frag:w0,meshphysical_vert:b0,meshphysical_frag:T0,meshtoon_vert:A0,meshtoon_frag:E0,points_vert:C0,points_frag:P0,shadow_vert:R0,shadow_frag:D0,sprite_vert:L0,sprite_frag:N0},Pe={common:{diffuse:{value:new lt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new at},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new at}},envmap:{envMap:{value:null},envMapRotation:{value:new at},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new at}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new at}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new at},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new at},normalScale:{value:new Le(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new at},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new at}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new at}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new at}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new lt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new lt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0},uvTransform:{value:new at}},sprite:{diffuse:{value:new lt(16777215)},opacity:{value:1},center:{value:new Le(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new at},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0}}},Tn={basic:{uniforms:Zt([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.fog]),vertexShader:ot.meshbasic_vert,fragmentShader:ot.meshbasic_frag},lambert:{uniforms:Zt([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,Pe.lights,{emissive:{value:new lt(0)}}]),vertexShader:ot.meshlambert_vert,fragmentShader:ot.meshlambert_frag},phong:{uniforms:Zt([Pe.common,Pe.specularmap,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,Pe.lights,{emissive:{value:new lt(0)},specular:{value:new lt(1118481)},shininess:{value:30}}]),vertexShader:ot.meshphong_vert,fragmentShader:ot.meshphong_frag},standard:{uniforms:Zt([Pe.common,Pe.envmap,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.roughnessmap,Pe.metalnessmap,Pe.fog,Pe.lights,{emissive:{value:new lt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ot.meshphysical_vert,fragmentShader:ot.meshphysical_frag},toon:{uniforms:Zt([Pe.common,Pe.aomap,Pe.lightmap,Pe.emissivemap,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.gradientmap,Pe.fog,Pe.lights,{emissive:{value:new lt(0)}}]),vertexShader:ot.meshtoon_vert,fragmentShader:ot.meshtoon_frag},matcap:{uniforms:Zt([Pe.common,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,Pe.fog,{matcap:{value:null}}]),vertexShader:ot.meshmatcap_vert,fragmentShader:ot.meshmatcap_frag},points:{uniforms:Zt([Pe.points,Pe.fog]),vertexShader:ot.points_vert,fragmentShader:ot.points_frag},dashed:{uniforms:Zt([Pe.common,Pe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ot.linedashed_vert,fragmentShader:ot.linedashed_frag},depth:{uniforms:Zt([Pe.common,Pe.displacementmap]),vertexShader:ot.depth_vert,fragmentShader:ot.depth_frag},normal:{uniforms:Zt([Pe.common,Pe.bumpmap,Pe.normalmap,Pe.displacementmap,{opacity:{value:1}}]),vertexShader:ot.meshnormal_vert,fragmentShader:ot.meshnormal_frag},sprite:{uniforms:Zt([Pe.sprite,Pe.fog]),vertexShader:ot.sprite_vert,fragmentShader:ot.sprite_frag},background:{uniforms:{uvTransform:{value:new at},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ot.background_vert,fragmentShader:ot.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new at}},vertexShader:ot.backgroundCube_vert,fragmentShader:ot.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ot.cube_vert,fragmentShader:ot.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ot.equirect_vert,fragmentShader:ot.equirect_frag},distanceRGBA:{uniforms:Zt([Pe.common,Pe.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ot.distanceRGBA_vert,fragmentShader:ot.distanceRGBA_frag},shadow:{uniforms:Zt([Pe.lights,Pe.fog,{color:{value:new lt(0)},opacity:{value:1}}]),vertexShader:ot.shadow_vert,fragmentShader:ot.shadow_frag}};Tn.physical={uniforms:Zt([Tn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new at},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new at},clearcoatNormalScale:{value:new Le(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new at},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new at},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new at},sheen:{value:0},sheenColor:{value:new lt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new at},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new at},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new at},transmissionSamplerSize:{value:new Le},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new at},attenuationDistance:{value:0},attenuationColor:{value:new lt(0)},specularColor:{value:new lt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new at},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new at},anisotropyVector:{value:new Le},anisotropyMap:{value:null},anisotropyMapTransform:{value:new at}}]),vertexShader:ot.meshphysical_vert,fragmentShader:ot.meshphysical_frag};const vr={r:0,b:0,g:0},xi=new Zn,F0=new yt;function I0(n,e,t,i,a,r,o){const s=new lt(0);let l=r===!0?0:1,c,f,d=null,h=0,p=null;function g(M){let S=M.isScene===!0?M.background:null;return S&&S.isTexture&&(S=(M.backgroundBlurriness>0?t:e).get(S)),S}function x(M){let S=!1;const v=g(M);v===null?u(s,l):v&&v.isColor&&(u(v,1),S=!0);const T=n.xr.getEnvironmentBlendMode();T==="additive"?i.buffers.color.setClear(0,0,0,1,o):T==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||S)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function m(M,S){const v=g(S);v&&(v.isCubeTexture||v.mapping===Jr)?(f===void 0&&(f=new ut(new $a(1,1,1),new Ke({name:"BackgroundCubeMaterial",uniforms:pa(Tn.backgroundCube.uniforms),vertexShader:Tn.backgroundCube.vertexShader,fragmentShader:Tn.backgroundCube.fragmentShader,side:Lt,depthTest:!1,depthWrite:!1,fog:!1})),f.geometry.deleteAttribute("normal"),f.geometry.deleteAttribute("uv"),f.onBeforeRender=function(T,w,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(f.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),a.update(f)),xi.copy(S.backgroundRotation),xi.x*=-1,xi.y*=-1,xi.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(xi.y*=-1,xi.z*=-1),f.material.uniforms.envMap.value=v,f.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,f.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,f.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,f.material.uniforms.backgroundRotation.value.setFromMatrix4(F0.makeRotationFromEuler(xi)),f.material.toneMapped=ht.getTransfer(v.colorSpace)!==St,(d!==v||h!==v.version||p!==n.toneMapping)&&(f.material.needsUpdate=!0,d=v,h=v.version,p=n.toneMapping),f.layers.enableAll(),M.unshift(f,f.geometry,f.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new ut(new en(2,2),new Ke({name:"BackgroundMaterial",uniforms:pa(Tn.background.uniforms),vertexShader:Tn.background.vertexShader,fragmentShader:Tn.background.fragmentShader,side:Xn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),a.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.toneMapped=ht.getTransfer(v.colorSpace)!==St,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(d!==v||h!==v.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,d=v,h=v.version,p=n.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function u(M,S){M.getRGB(vr,Mu(n)),i.buffers.color.setClear(vr.r,vr.g,vr.b,S,o)}return{getClearColor:function(){return s},setClearColor:function(M,S=1){s.set(M),l=S,u(s,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,u(s,l)},render:x,addToRenderList:m}}function U0(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},a=h(null);let r=a,o=!1;function s(_,P,I,F,X){let q=!1;const B=d(F,I,P);r!==B&&(r=B,c(r.object)),q=p(_,F,I,X),q&&g(_,F,I,X),X!==null&&e.update(X,n.ELEMENT_ARRAY_BUFFER),(q||o)&&(o=!1,v(_,P,I,F),X!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(X).buffer))}function l(){return n.createVertexArray()}function c(_){return n.bindVertexArray(_)}function f(_){return n.deleteVertexArray(_)}function d(_,P,I){const F=I.wireframe===!0;let X=i[_.id];X===void 0&&(X={},i[_.id]=X);let q=X[P.id];q===void 0&&(q={},X[P.id]=q);let B=q[F];return B===void 0&&(B=h(l()),q[F]=B),B}function h(_){const P=[],I=[],F=[];for(let X=0;X<t;X++)P[X]=0,I[X]=0,F[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:I,attributeDivisors:F,object:_,attributes:{},index:null}}function p(_,P,I,F){const X=r.attributes,q=P.attributes;let B=0;const K=I.getAttributes();for(const H in K)if(K[H].location>=0){const ue=X[H];let de=q[H];if(de===void 0&&(H==="instanceMatrix"&&_.instanceMatrix&&(de=_.instanceMatrix),H==="instanceColor"&&_.instanceColor&&(de=_.instanceColor)),ue===void 0||ue.attribute!==de||de&&ue.data!==de.data)return!0;B++}return r.attributesNum!==B||r.index!==F}function g(_,P,I,F){const X={},q=P.attributes;let B=0;const K=I.getAttributes();for(const H in K)if(K[H].location>=0){let ue=q[H];ue===void 0&&(H==="instanceMatrix"&&_.instanceMatrix&&(ue=_.instanceMatrix),H==="instanceColor"&&_.instanceColor&&(ue=_.instanceColor));const de={};de.attribute=ue,ue&&ue.data&&(de.data=ue.data),X[H]=de,B++}r.attributes=X,r.attributesNum=B,r.index=F}function x(){const _=r.newAttributes;for(let P=0,I=_.length;P<I;P++)_[P]=0}function m(_){u(_,0)}function u(_,P){const I=r.newAttributes,F=r.enabledAttributes,X=r.attributeDivisors;I[_]=1,F[_]===0&&(n.enableVertexAttribArray(_),F[_]=1),X[_]!==P&&(n.vertexAttribDivisor(_,P),X[_]=P)}function M(){const _=r.newAttributes,P=r.enabledAttributes;for(let I=0,F=P.length;I<F;I++)P[I]!==_[I]&&(n.disableVertexAttribArray(I),P[I]=0)}function S(_,P,I,F,X,q,B){B===!0?n.vertexAttribIPointer(_,P,I,X,q):n.vertexAttribPointer(_,P,I,F,X,q)}function v(_,P,I,F){x();const X=F.attributes,q=I.getAttributes(),B=P.defaultAttributeValues;for(const K in q){const H=q[K];if(H.location>=0){let se=X[K];if(se===void 0&&(K==="instanceMatrix"&&_.instanceMatrix&&(se=_.instanceMatrix),K==="instanceColor"&&_.instanceColor&&(se=_.instanceColor)),se!==void 0){const ue=se.normalized,de=se.itemSize,_e=e.get(se);if(_e===void 0)continue;const Re=_e.buffer,j=_e.type,le=_e.bytesPerElement,Te=j===n.INT||j===n.UNSIGNED_INT||se.gpuType===Ws;if(se.isInterleavedBufferAttribute){const fe=se.data,we=fe.stride,ve=se.offset;if(fe.isInstancedInterleavedBuffer){for(let qe=0;qe<H.locationSize;qe++)u(H.location+qe,fe.meshPerAttribute);_.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=fe.meshPerAttribute*fe.count)}else for(let qe=0;qe<H.locationSize;qe++)m(H.location+qe);n.bindBuffer(n.ARRAY_BUFFER,Re);for(let qe=0;qe<H.locationSize;qe++)S(H.location+qe,de/H.locationSize,j,ue,we*le,(ve+de/H.locationSize*qe)*le,Te)}else{if(se.isInstancedBufferAttribute){for(let fe=0;fe<H.locationSize;fe++)u(H.location+fe,se.meshPerAttribute);_.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let fe=0;fe<H.locationSize;fe++)m(H.location+fe);n.bindBuffer(n.ARRAY_BUFFER,Re);for(let fe=0;fe<H.locationSize;fe++)S(H.location+fe,de/H.locationSize,j,ue,de*le,de/H.locationSize*fe*le,Te)}}else if(B!==void 0){const ue=B[K];if(ue!==void 0)switch(ue.length){case 2:n.vertexAttrib2fv(H.location,ue);break;case 3:n.vertexAttrib3fv(H.location,ue);break;case 4:n.vertexAttrib4fv(H.location,ue);break;default:n.vertexAttrib1fv(H.location,ue)}}}}M()}function T(){C();for(const _ in i){const P=i[_];for(const I in P){const F=P[I];for(const X in F)f(F[X].object),delete F[X];delete P[I]}delete i[_]}}function w(_){if(i[_.id]===void 0)return;const P=i[_.id];for(const I in P){const F=P[I];for(const X in F)f(F[X].object),delete F[X];delete P[I]}delete i[_.id]}function E(_){for(const P in i){const I=i[P];if(I[_.id]===void 0)continue;const F=I[_.id];for(const X in F)f(F[X].object),delete F[X];delete I[_.id]}}function C(){y(),o=!0,r!==a&&(r=a,c(r.object))}function y(){a.geometry=null,a.program=null,a.wireframe=!1}return{setup:s,reset:C,resetDefaultState:y,dispose:T,releaseStatesOfGeometry:w,releaseStatesOfProgram:E,initAttributes:x,enableAttribute:m,disableUnusedAttributes:M}}function z0(n,e,t){let i;function a(c){i=c}function r(c,f){n.drawArrays(i,c,f),t.update(f,i,1)}function o(c,f,d){d!==0&&(n.drawArraysInstanced(i,c,f,d),t.update(f,i,d))}function s(c,f,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,f,0,d);let p=0;for(let g=0;g<d;g++)p+=f[g];t.update(p,i,1)}function l(c,f,d,h){if(d===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<c.length;g++)o(c[g],f[g],h[g]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,f,0,h,0,d);let g=0;for(let x=0;x<d;x++)g+=f[x]*h[x];t.update(g,i,1)}}this.setMode=a,this.render=r,this.renderInstances=o,this.renderMultiDraw=s,this.renderMultiDrawInstances=l}function O0(n,e,t,i){let a;function r(){if(a!==void 0)return a;if(e.has("EXT_texture_filter_anisotropic")===!0){const E=e.get("EXT_texture_filter_anisotropic");a=n.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else a=0;return a}function o(E){return!(E!==Sn&&i.convert(E)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function s(E){const C=E===Pn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(E!==qn&&i.convert(E)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==Cn&&!C)}function l(E){if(E==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const f=l(c);f!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",f,"instead."),c=f);const d=t.logarithmicDepthBuffer===!0,h=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),u=n.getParameter(n.MAX_VERTEX_ATTRIBS),M=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),S=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),T=g>0,w=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:s,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:h,maxTextures:p,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:m,maxAttributes:u,maxVertexUniforms:M,maxVaryings:S,maxFragmentUniforms:v,vertexTextures:T,maxSamples:w}}function B0(n){const e=this;let t=null,i=0,a=!1,r=!1;const o=new On,s=new at,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){const p=d.length!==0||h||i!==0||a;return a=h,i=d.length,p},this.beginShadows=function(){r=!0,f(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,h){t=f(d,h,0)},this.setState=function(d,h,p){const g=d.clippingPlanes,x=d.clipIntersection,m=d.clipShadows,u=n.get(d);if(!a||g===null||g.length===0||r&&!m)r?f(null):c();else{const M=r?0:i,S=M*4;let v=u.clippingState||null;l.value=v,v=f(g,h,S,p);for(let T=0;T!==S;++T)v[T]=t[T];u.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function f(d,h,p,g){const x=d!==null?d.length:0;let m=null;if(x!==0){if(m=l.value,g!==!0||m===null){const u=p+x*4,M=h.matrixWorldInverse;s.getNormalMatrix(M),(m===null||m.length<u)&&(m=new Float32Array(u));for(let S=0,v=p;S!==x;++S,v+=4)o.copy(d[S]).applyMatrix4(M,s),o.normal.toArray(m,v),m[v+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,m}}function k0(n){let e=new WeakMap;function t(o,s){return s===is?o.mapping=ua:s===as&&(o.mapping=da),o}function i(o){if(o&&o.isTexture){const s=o.mapping;if(s===is||s===as)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new $d(l.height);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",a),t(c.texture,o.mapping)}else return null}}return o}function a(o){const s=o.target;s.removeEventListener("dispose",a);const l=e.get(s);l!==void 0&&(e.delete(s),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}class Js extends Su{constructor(e=-1,t=1,i=1,a=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=a,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,a,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=a,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,a=(this.top+this.bottom)/2;let r=i-e,o=i+e,s=a+t,l=a-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,s-=f*this.view.offsetY,l=s-f*this.view.height}this.projectionMatrix.makeOrthographic(r,o,s,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const ea=4,kl=[.125,.215,.35,.446,.526,.582],Ti=20,Fo=new Js,Vl=new lt;let Io=null,Uo=0,zo=0,Oo=!1;const Si=(1+Math.sqrt(5))/2,Zi=1/Si,Wl=[new D(-Si,Zi,0),new D(Si,Zi,0),new D(-Zi,0,Si),new D(Zi,0,Si),new D(0,Si,-Zi),new D(0,Si,Zi),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)];class Gl{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,a=100){Io=this._renderer.getRenderTarget(),Uo=this._renderer.getActiveCubeFace(),zo=this._renderer.getActiveMipmapLevel(),Oo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,i,a,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ql(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Xl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Io,Uo,zo),this._renderer.xr.enabled=Oo,e.scissorTest=!1,gr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ua||e.mapping===da?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Io=this._renderer.getRenderTarget(),Uo=this._renderer.getActiveCubeFace(),zo=this._renderer.getActiveMipmapLevel(),Oo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:En,minFilter:En,generateMipmaps:!1,type:Pn,format:Sn,colorSpace:ga,depthBuffer:!1},a=Hl(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Hl(e,t,i);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=V0(r)),this._blurMaterial=W0(r,e,t)}return a}_compileMaterial(e){const t=new ut(this._lodPlanes[0],e);this._renderer.compile(t,Fo)}_sceneToCubeUV(e,t,i,a){const s=new Qt(90,1,t,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],f=this._renderer,d=f.autoClear,h=f.toneMapping;f.getClearColor(Vl),f.toneMapping=hi,f.autoClear=!1;const p=new $s({name:"PMREM.Background",side:Lt,depthWrite:!1,depthTest:!1}),g=new ut(new $a,p);let x=!1;const m=e.background;m?m.isColor&&(p.color.copy(m),e.background=null,x=!0):(p.color.copy(Vl),x=!0);for(let u=0;u<6;u++){const M=u%3;M===0?(s.up.set(0,l[u],0),s.lookAt(c[u],0,0)):M===1?(s.up.set(0,0,l[u]),s.lookAt(0,c[u],0)):(s.up.set(0,l[u],0),s.lookAt(0,0,c[u]));const S=this._cubeSize;gr(a,M*S,u>2?S:0,S,S),f.setRenderTarget(a),x&&f.render(g,s),f.render(e,s)}g.geometry.dispose(),g.material.dispose(),f.toneMapping=h,f.autoClear=d,e.background=m}_textureToCubeUV(e,t){const i=this._renderer,a=e.mapping===ua||e.mapping===da;a?(this._cubemapMaterial===null&&(this._cubemapMaterial=ql()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Xl());const r=a?this._cubemapMaterial:this._equirectMaterial,o=new ut(this._lodPlanes[0],r),s=r.uniforms;s.envMap.value=e;const l=this._cubeSize;gr(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Fo)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const a=this._lodPlanes.length;for(let r=1;r<a;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),s=Wl[(a-r-1)%Wl.length];this._blur(e,r-1,r,o,s)}t.autoClear=i}_blur(e,t,i,a,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,a,"latitudinal",r),this._halfBlur(o,e,i,i,a,"longitudinal",r)}_halfBlur(e,t,i,a,r,o,s){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const f=3,d=new ut(this._lodPlanes[a],c),h=c.uniforms,p=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*Ti-1),x=r/g,m=isFinite(r)?1+Math.floor(f*x):Ti;m>Ti&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ti}`);const u=[];let M=0;for(let E=0;E<Ti;++E){const C=E/x,y=Math.exp(-C*C/2);u.push(y),E===0?M+=y:E<m&&(M+=2*y)}for(let E=0;E<u.length;E++)u[E]=u[E]/M;h.envMap.value=e.texture,h.samples.value=m,h.weights.value=u,h.latitudinal.value=o==="latitudinal",s&&(h.poleAxis.value=s);const{_lodMax:S}=this;h.dTheta.value=g,h.mipInt.value=S-i;const v=this._sizeLods[a],T=3*v*(a>S-ea?a-S+ea:0),w=4*(this._cubeSize-v);gr(t,T,w,3*v,2*v),l.setRenderTarget(t),l.render(d,Fo)}}function V0(n){const e=[],t=[],i=[];let a=n;const r=n-ea+1+kl.length;for(let o=0;o<r;o++){const s=Math.pow(2,a);t.push(s);let l=1/s;o>n-ea?l=kl[o-n+ea-1]:o===0&&(l=0),i.push(l);const c=1/(s-2),f=-c,d=1+c,h=[f,f,d,f,d,d,f,f,d,d,f,d],p=6,g=6,x=3,m=2,u=1,M=new Float32Array(x*g*p),S=new Float32Array(m*g*p),v=new Float32Array(u*g*p);for(let w=0;w<p;w++){const E=w%3*2/3-1,C=w>2?0:-1,y=[E,C,0,E+2/3,C,0,E+2/3,C+1,0,E,C,0,E+2/3,C+1,0,E,C+1,0];M.set(y,x*g*w),S.set(h,m*g*w);const _=[w,w,w,w,w,w];v.set(_,u*g*w)}const T=new st;T.setAttribute("position",new De(M,x)),T.setAttribute("uv",new De(S,m)),T.setAttribute("faceIndex",new De(v,u)),e.push(T),a>ea&&a--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Hl(n,e,t){const i=new vn(n,e,t);return i.texture.mapping=Jr,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function gr(n,e,t,i,a){n.viewport.set(e,t,i,a),n.scissor.set(e,t,i,a)}function W0(n,e,t){const i=new Float32Array(Ti),a=new D(0,1,0);return new Ke({name:"SphericalGaussianBlur",defines:{n:Ti,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:a}},vertexShader:Qs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Wn,depthTest:!1,depthWrite:!1})}function Xl(){return new Ke({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Qs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Wn,depthTest:!1,depthWrite:!1})}function ql(){return new Ke({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Qs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Wn,depthTest:!1,depthWrite:!1})}function Qs(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function G0(n){let e=new WeakMap,t=null;function i(s){if(s&&s.isTexture){const l=s.mapping,c=l===is||l===as,f=l===ua||l===da;if(c||f){let d=e.get(s);const h=d!==void 0?d.texture.pmremVersion:0;if(s.isRenderTargetTexture&&s.pmremVersion!==h)return t===null&&(t=new Gl(n)),d=c?t.fromEquirectangular(s,d):t.fromCubemap(s,d),d.texture.pmremVersion=s.pmremVersion,e.set(s,d),d.texture;if(d!==void 0)return d.texture;{const p=s.image;return c&&p&&p.height>0||f&&p&&a(p)?(t===null&&(t=new Gl(n)),d=c?t.fromEquirectangular(s):t.fromCubemap(s),d.texture.pmremVersion=s.pmremVersion,e.set(s,d),s.addEventListener("dispose",r),d.texture):null}}}return s}function a(s){let l=0;const c=6;for(let f=0;f<c;f++)s[f]!==void 0&&l++;return l===c}function r(s){const l=s.target;l.removeEventListener("dispose",r);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function H0(n){const e={};function t(i){if(e[i]!==void 0)return e[i];let a;switch(i){case"WEBGL_depth_texture":a=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":a=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":a=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":a=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:a=n.getExtension(i)}return e[i]=a,a}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const a=t(i);return a===null&&Fa("THREE.WebGLRenderer: "+i+" extension not supported."),a}}}function X0(n,e,t,i){const a={},r=new WeakMap;function o(d){const h=d.target;h.index!==null&&e.remove(h.index);for(const g in h.attributes)e.remove(h.attributes[g]);for(const g in h.morphAttributes){const x=h.morphAttributes[g];for(let m=0,u=x.length;m<u;m++)e.remove(x[m])}h.removeEventListener("dispose",o),delete a[h.id];const p=r.get(h);p&&(e.remove(p),r.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function s(d,h){return a[h.id]===!0||(h.addEventListener("dispose",o),a[h.id]=!0,t.memory.geometries++),h}function l(d){const h=d.attributes;for(const g in h)e.update(h[g],n.ARRAY_BUFFER);const p=d.morphAttributes;for(const g in p){const x=p[g];for(let m=0,u=x.length;m<u;m++)e.update(x[m],n.ARRAY_BUFFER)}}function c(d){const h=[],p=d.index,g=d.attributes.position;let x=0;if(p!==null){const M=p.array;x=p.version;for(let S=0,v=M.length;S<v;S+=3){const T=M[S+0],w=M[S+1],E=M[S+2];h.push(T,w,w,E,E,T)}}else if(g!==void 0){const M=g.array;x=g.version;for(let S=0,v=M.length/3-1;S<v;S+=3){const T=S+0,w=S+1,E=S+2;h.push(T,w,w,E,E,T)}}else return;const m=new(mu(h)?yu:_u)(h,1);m.version=x;const u=r.get(d);u&&e.remove(u),r.set(d,m)}function f(d){const h=r.get(d);if(h){const p=d.index;p!==null&&h.version<p.version&&c(d)}else c(d);return r.get(d)}return{get:s,update:l,getWireframeAttribute:f}}function q0(n,e,t){let i;function a(h){i=h}let r,o;function s(h){r=h.type,o=h.bytesPerElement}function l(h,p){n.drawElements(i,p,r,h*o),t.update(p,i,1)}function c(h,p,g){g!==0&&(n.drawElementsInstanced(i,p,r,h*o,g),t.update(p,i,g))}function f(h,p,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,r,h,0,g);let m=0;for(let u=0;u<g;u++)m+=p[u];t.update(m,i,1)}function d(h,p,g,x){if(g===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let u=0;u<h.length;u++)c(h[u]/o,p[u],x[u]);else{m.multiDrawElementsInstancedWEBGL(i,p,0,r,h,0,x,0,g);let u=0;for(let M=0;M<g;M++)u+=p[M]*x[M];t.update(u,i,1)}}this.setMode=a,this.setIndex=s,this.render=l,this.renderInstances=c,this.renderMultiDraw=f,this.renderMultiDrawInstances=d}function Y0(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,s){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=s*(r/3);break;case n.LINES:t.lines+=s*(r/2);break;case n.LINE_STRIP:t.lines+=s*(r-1);break;case n.LINE_LOOP:t.lines+=s*r;break;case n.POINTS:t.points+=s*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function a(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:a,update:i}}function Z0(n,e,t){const i=new WeakMap,a=new wt;function r(o,s,l){const c=o.morphTargetInfluences,f=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,d=f!==void 0?f.length:0;let h=i.get(s);if(h===void 0||h.count!==d){let _=function(){C.dispose(),i.delete(s),s.removeEventListener("dispose",_)};var p=_;h!==void 0&&h.texture.dispose();const g=s.morphAttributes.position!==void 0,x=s.morphAttributes.normal!==void 0,m=s.morphAttributes.color!==void 0,u=s.morphAttributes.position||[],M=s.morphAttributes.normal||[],S=s.morphAttributes.color||[];let v=0;g===!0&&(v=1),x===!0&&(v=2),m===!0&&(v=3);let T=s.attributes.position.count*v,w=1;T>e.maxTextureSize&&(w=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const E=new Float32Array(T*w*4*d),C=new gu(E,T,w,d);C.type=Cn,C.needsUpdate=!0;const y=v*4;for(let P=0;P<d;P++){const I=u[P],F=M[P],X=S[P],q=T*w*4*P;for(let B=0;B<I.count;B++){const K=B*y;g===!0&&(a.fromBufferAttribute(I,B),E[q+K+0]=a.x,E[q+K+1]=a.y,E[q+K+2]=a.z,E[q+K+3]=0),x===!0&&(a.fromBufferAttribute(F,B),E[q+K+4]=a.x,E[q+K+5]=a.y,E[q+K+6]=a.z,E[q+K+7]=0),m===!0&&(a.fromBufferAttribute(X,B),E[q+K+8]=a.x,E[q+K+9]=a.y,E[q+K+10]=a.z,E[q+K+11]=X.itemSize===4?a.w:1)}}h={count:d,texture:C,size:new Le(T,w)},i.set(s,h),s.addEventListener("dispose",_)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let g=0;for(let m=0;m<c.length;m++)g+=c[m];const x=s.morphTargetsRelative?1:1-g;l.getUniforms().setValue(n,"morphTargetBaseInfluence",x),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:r}}function j0(n,e,t,i){let a=new WeakMap;function r(l){const c=i.render.frame,f=l.geometry,d=e.get(l,f);if(a.get(d)!==c&&(e.update(d),a.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",s)===!1&&l.addEventListener("dispose",s),a.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),a.set(l,c))),l.isSkinnedMesh){const h=l.skeleton;a.get(h)!==c&&(h.update(),a.set(h,c))}return d}function o(){a=new WeakMap}function s(l){const c=l.target;c.removeEventListener("dispose",s),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}class Tu extends jt{constructor(e,t,i,a,r,o,s,l,c,f=oa){if(f!==oa&&f!==fa)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&f===oa&&(i=Ri),i===void 0&&f===fa&&(i=ha),super(null,a,r,o,s,l,f,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=s!==void 0?s:un,this.minFilter=l!==void 0?l:un,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const Au=new jt,Yl=new Tu(1,1),Eu=new gu,Cu=new Id,Pu=new wu,Zl=[],jl=[],$l=new Float32Array(16),Kl=new Float32Array(9),Jl=new Float32Array(4);function _a(n,e,t){const i=n[0];if(i<=0||i>0)return n;const a=e*t;let r=Zl[a];if(r===void 0&&(r=new Float32Array(a),Zl[a]=r),e!==0){i.toArray(r,0);for(let o=1,s=0;o!==e;++o)s+=t,n[o].toArray(r,s)}return r}function Ft(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function It(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function to(n,e){let t=jl[e];t===void 0&&(t=new Int32Array(e),jl[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function $0(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function K0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ft(t,e))return;n.uniform2fv(this.addr,e),It(t,e)}}function J0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ft(t,e))return;n.uniform3fv(this.addr,e),It(t,e)}}function Q0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ft(t,e))return;n.uniform4fv(this.addr,e),It(t,e)}}function ep(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ft(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),It(t,e)}else{if(Ft(t,i))return;Jl.set(i),n.uniformMatrix2fv(this.addr,!1,Jl),It(t,i)}}function tp(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ft(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),It(t,e)}else{if(Ft(t,i))return;Kl.set(i),n.uniformMatrix3fv(this.addr,!1,Kl),It(t,i)}}function np(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ft(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),It(t,e)}else{if(Ft(t,i))return;$l.set(i),n.uniformMatrix4fv(this.addr,!1,$l),It(t,i)}}function ip(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function ap(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ft(t,e))return;n.uniform2iv(this.addr,e),It(t,e)}}function rp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ft(t,e))return;n.uniform3iv(this.addr,e),It(t,e)}}function op(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ft(t,e))return;n.uniform4iv(this.addr,e),It(t,e)}}function sp(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function lp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ft(t,e))return;n.uniform2uiv(this.addr,e),It(t,e)}}function cp(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ft(t,e))return;n.uniform3uiv(this.addr,e),It(t,e)}}function up(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ft(t,e))return;n.uniform4uiv(this.addr,e),It(t,e)}}function dp(n,e,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(n.uniform1i(this.addr,a),i[0]=a);let r;this.type===n.SAMPLER_2D_SHADOW?(Yl.compareFunction=pu,r=Yl):r=Au,t.setTexture2D(e||r,a)}function hp(n,e,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(n.uniform1i(this.addr,a),i[0]=a),t.setTexture3D(e||Cu,a)}function fp(n,e,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(n.uniform1i(this.addr,a),i[0]=a),t.setTextureCube(e||Pu,a)}function pp(n,e,t){const i=this.cache,a=t.allocateTextureUnit();i[0]!==a&&(n.uniform1i(this.addr,a),i[0]=a),t.setTexture2DArray(e||Eu,a)}function mp(n){switch(n){case 5126:return $0;case 35664:return K0;case 35665:return J0;case 35666:return Q0;case 35674:return ep;case 35675:return tp;case 35676:return np;case 5124:case 35670:return ip;case 35667:case 35671:return ap;case 35668:case 35672:return rp;case 35669:case 35673:return op;case 5125:return sp;case 36294:return lp;case 36295:return cp;case 36296:return up;case 35678:case 36198:case 36298:case 36306:case 35682:return dp;case 35679:case 36299:case 36307:return hp;case 35680:case 36300:case 36308:case 36293:return fp;case 36289:case 36303:case 36311:case 36292:return pp}}function vp(n,e){n.uniform1fv(this.addr,e)}function gp(n,e){const t=_a(e,this.size,2);n.uniform2fv(this.addr,t)}function xp(n,e){const t=_a(e,this.size,3);n.uniform3fv(this.addr,t)}function _p(n,e){const t=_a(e,this.size,4);n.uniform4fv(this.addr,t)}function yp(n,e){const t=_a(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Mp(n,e){const t=_a(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Sp(n,e){const t=_a(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function wp(n,e){n.uniform1iv(this.addr,e)}function bp(n,e){n.uniform2iv(this.addr,e)}function Tp(n,e){n.uniform3iv(this.addr,e)}function Ap(n,e){n.uniform4iv(this.addr,e)}function Ep(n,e){n.uniform1uiv(this.addr,e)}function Cp(n,e){n.uniform2uiv(this.addr,e)}function Pp(n,e){n.uniform3uiv(this.addr,e)}function Rp(n,e){n.uniform4uiv(this.addr,e)}function Dp(n,e,t){const i=this.cache,a=e.length,r=to(t,a);Ft(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let o=0;o!==a;++o)t.setTexture2D(e[o]||Au,r[o])}function Lp(n,e,t){const i=this.cache,a=e.length,r=to(t,a);Ft(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let o=0;o!==a;++o)t.setTexture3D(e[o]||Cu,r[o])}function Np(n,e,t){const i=this.cache,a=e.length,r=to(t,a);Ft(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let o=0;o!==a;++o)t.setTextureCube(e[o]||Pu,r[o])}function Fp(n,e,t){const i=this.cache,a=e.length,r=to(t,a);Ft(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let o=0;o!==a;++o)t.setTexture2DArray(e[o]||Eu,r[o])}function Ip(n){switch(n){case 5126:return vp;case 35664:return gp;case 35665:return xp;case 35666:return _p;case 35674:return yp;case 35675:return Mp;case 35676:return Sp;case 5124:case 35670:return wp;case 35667:case 35671:return bp;case 35668:case 35672:return Tp;case 35669:case 35673:return Ap;case 5125:return Ep;case 36294:return Cp;case 36295:return Pp;case 36296:return Rp;case 35678:case 36198:case 36298:case 36306:case 35682:return Dp;case 35679:case 36299:case 36307:return Lp;case 35680:case 36300:case 36308:case 36293:return Np;case 36289:case 36303:case 36311:case 36292:return Fp}}class Up{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=mp(t.type)}}class zp{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ip(t.type)}}class Op{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const a=this.seq;for(let r=0,o=a.length;r!==o;++r){const s=a[r];s.setValue(e,t[s.id],i)}}}const Bo=/(\w+)(\])?(\[|\.)?/g;function Ql(n,e){n.seq.push(e),n.map[e.id]=e}function Bp(n,e,t){const i=n.name,a=i.length;for(Bo.lastIndex=0;;){const r=Bo.exec(i),o=Bo.lastIndex;let s=r[1];const l=r[2]==="]",c=r[3];if(l&&(s=s|0),c===void 0||c==="["&&o+2===a){Ql(t,c===void 0?new Up(s,n,e):new zp(s,n,e));break}else{let d=t.map[s];d===void 0&&(d=new Op(s),Ql(t,d)),t=d}}}class Wr{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const r=e.getActiveUniform(t,a),o=e.getUniformLocation(t,r.name);Bp(r,o,this)}}setValue(e,t,i,a){const r=this.map[t];r!==void 0&&r.setValue(e,i,a)}setOptional(e,t,i){const a=t[i];a!==void 0&&this.setValue(e,i,a)}static upload(e,t,i,a){for(let r=0,o=t.length;r!==o;++r){const s=t[r],l=i[s.id];l.needsUpdate!==!1&&s.setValue(e,l.value,a)}}static seqWithValue(e,t){const i=[];for(let a=0,r=e.length;a!==r;++a){const o=e[a];o.id in t&&i.push(o)}return i}}function ec(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const kp=37297;let Vp=0;function Wp(n,e){const t=n.split(`
`),i=[],a=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=a;o<r;o++){const s=o+1;i.push(`${s===e?">":" "} ${s}: ${t[o]}`)}return i.join(`
`)}const tc=new at;function Gp(n){ht._getMatrix(tc,ht.workingColorSpace,n);const e=`mat3( ${tc.elements.map(t=>t.toFixed(4))} )`;switch(ht.getTransfer(n)){case Qr:return[e,"LinearTransferOETF"];case St:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function nc(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),a=n.getShaderInfoLog(e).trim();if(i&&a==="")return"";const r=/ERROR: 0:(\d+)/.exec(a);if(r){const o=parseInt(r[1]);return t.toUpperCase()+`

`+a+`

`+Wp(n.getShaderSource(e),o)}else return a}function Hp(n,e){const t=Gp(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Xp(n,e){let t;switch(e){case Qc:t="Linear";break;case eu:t="Reinhard";break;case tu:t="Cineon";break;case Vs:t="ACESFilmic";break;case nu:t="AgX";break;case iu:t="Neutral";break;case dd:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const xr=new D;function qp(){ht.getLuminanceCoefficients(xr);const n=xr.x.toFixed(4),e=xr.y.toFixed(4),t=xr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Yp(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ia).join(`
`)}function Zp(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function jp(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let a=0;a<i;a++){const r=n.getActiveAttrib(e,a),o=r.name;let s=1;r.type===n.FLOAT_MAT2&&(s=2),r.type===n.FLOAT_MAT3&&(s=3),r.type===n.FLOAT_MAT4&&(s=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:s}}return t}function Ia(n){return n!==""}function ic(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ac(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const $p=/^[ \t]*#include +<([\w\d./]+)>/gm;function Fs(n){return n.replace($p,Jp)}const Kp=new Map;function Jp(n,e){let t=ot[e];if(t===void 0){const i=Kp.get(e);if(i!==void 0)t=ot[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Fs(t)}const Qp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function rc(n){return n.replace(Qp,em)}function em(n,e,t,i){let a="";for(let r=parseInt(e);r<parseInt(t);r++)a+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return a}function oc(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function tm(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Kc?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Hu?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Un&&(e="SHADOWMAP_TYPE_VSM"),e}function nm(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case ua:case da:e="ENVMAP_TYPE_CUBE";break;case Jr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function im(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case da:e="ENVMAP_MODE_REFRACTION";break}return e}function am(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Jc:e="ENVMAP_BLENDING_MULTIPLY";break;case cd:e="ENVMAP_BLENDING_MIX";break;case ud:e="ENVMAP_BLENDING_ADD";break}return e}function rm(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function om(n,e,t,i){const a=n.getContext(),r=t.defines;let o=t.vertexShader,s=t.fragmentShader;const l=tm(t),c=nm(t),f=im(t),d=am(t),h=rm(t),p=Yp(t),g=Zp(r),x=a.createProgram();let m,u,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Ia).join(`
`),m.length>0&&(m+=`
`),u=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Ia).join(`
`),u.length>0&&(u+=`
`)):(m=[oc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ia).join(`
`),u=[oc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+f:"",t.envMap?"#define "+d:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==hi?"#define TONE_MAPPING":"",t.toneMapping!==hi?ot.tonemapping_pars_fragment:"",t.toneMapping!==hi?Xp("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ot.colorspace_pars_fragment,Hp("linearToOutputTexel",t.outputColorSpace),qp(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ia).join(`
`)),o=Fs(o),o=ic(o,t),o=ac(o,t),s=Fs(s),s=ic(s,t),s=ac(s,t),o=rc(o),s=rc(s),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,u=["#define varying in",t.glslVersion===_l?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===_l?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);const S=M+m+o,v=M+u+s,T=ec(a,a.VERTEX_SHADER,S),w=ec(a,a.FRAGMENT_SHADER,v);a.attachShader(x,T),a.attachShader(x,w),t.index0AttributeName!==void 0?a.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&a.bindAttribLocation(x,0,"position"),a.linkProgram(x);function E(P){if(n.debug.checkShaderErrors){const I=a.getProgramInfoLog(x).trim(),F=a.getShaderInfoLog(T).trim(),X=a.getShaderInfoLog(w).trim();let q=!0,B=!0;if(a.getProgramParameter(x,a.LINK_STATUS)===!1)if(q=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(a,x,T,w);else{const K=nc(a,T,"vertex"),H=nc(a,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+a.getError()+" - VALIDATE_STATUS "+a.getProgramParameter(x,a.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+I+`
`+K+`
`+H)}else I!==""?console.warn("THREE.WebGLProgram: Program Info Log:",I):(F===""||X==="")&&(B=!1);B&&(P.diagnostics={runnable:q,programLog:I,vertexShader:{log:F,prefix:m},fragmentShader:{log:X,prefix:u}})}a.deleteShader(T),a.deleteShader(w),C=new Wr(a,x),y=jp(a,x)}let C;this.getUniforms=function(){return C===void 0&&E(this),C};let y;this.getAttributes=function(){return y===void 0&&E(this),y};let _=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=a.getProgramParameter(x,kp)),_},this.destroy=function(){i.releaseStatesOfProgram(this),a.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Vp++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=T,this.fragmentShader=w,this}let sm=0;class lm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,a=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(a)===!1&&(o.add(a),a.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new cm(e),t.set(e,i)),i}}class cm{constructor(e){this.id=sm++,this.code=e,this.usedTimes=0}}function um(n,e,t,i,a,r,o){const s=new js,l=new lm,c=new Set,f=[],d=a.logarithmicDepthBuffer,h=a.vertexTextures;let p=a.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(y){return c.add(y),y===0?"uv":`uv${y}`}function m(y,_,P,I,F){const X=I.fog,q=F.geometry,B=y.isMeshStandardMaterial?I.environment:null,K=(y.isMeshStandardMaterial?t:e).get(y.envMap||B),H=K&&K.mapping===Jr?K.image.height:null,se=g[y.type];y.precision!==null&&(p=a.getMaxPrecision(y.precision),p!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",p,"instead."));const ue=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,de=ue!==void 0?ue.length:0;let _e=0;q.morphAttributes.position!==void 0&&(_e=1),q.morphAttributes.normal!==void 0&&(_e=2),q.morphAttributes.color!==void 0&&(_e=3);let Re,j,le,Te;if(se){const Ee=Tn[se];Re=Ee.vertexShader,j=Ee.fragmentShader}else Re=y.vertexShader,j=y.fragmentShader,l.update(y),le=l.getVertexShaderID(y),Te=l.getFragmentShaderID(y);const fe=n.getRenderTarget(),we=n.state.buffers.depth.getReversed(),ve=F.isInstancedMesh===!0,qe=F.isBatchedMesh===!0,Je=!!y.map,$e=!!y.matcap,Qe=!!K,z=!!y.aoMap,nt=!!y.lightMap,be=!!y.bumpMap,J=!!y.normalMap,ce=!!y.displacementMap,ge=!!y.emissiveMap,pe=!!y.metalnessMap,R=!!y.roughnessMap,b=y.anisotropy>0,k=y.clearcoat>0,Q=y.dispersion>0,N=y.iridescence>0,G=y.sheen>0,te=y.transmission>0,O=b&&!!y.anisotropyMap,he=k&&!!y.clearcoatMap,Ae=k&&!!y.clearcoatNormalMap,ee=k&&!!y.clearcoatRoughnessMap,me=N&&!!y.iridescenceMap,Ce=N&&!!y.iridescenceThicknessMap,Ie=G&&!!y.sheenColorMap,Me=G&&!!y.sheenRoughnessMap,Ye=!!y.specularMap,ne=!!y.specularColorMap,Se=!!y.specularIntensityMap,L=te&&!!y.transmissionMap,ae=te&&!!y.thicknessMap,V=!!y.gradientMap,$=!!y.alphaMap,oe=y.alphaTest>0,re=!!y.alphaHash,ye=!!y.extensions;let We=hi;y.toneMapped&&(fe===null||fe.isXRRenderTarget===!0)&&(We=n.toneMapping);const Ne={shaderID:se,shaderType:y.type,shaderName:y.name,vertexShader:Re,fragmentShader:j,defines:y.defines,customVertexShaderID:le,customFragmentShaderID:Te,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:p,batching:qe,batchingColor:qe&&F._colorsTexture!==null,instancing:ve,instancingColor:ve&&F.instanceColor!==null,instancingMorph:ve&&F.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:fe===null?n.outputColorSpace:fe.isXRRenderTarget===!0?fe.texture.colorSpace:ga,alphaToCoverage:!!y.alphaToCoverage,map:Je,matcap:$e,envMap:Qe,envMapMode:Qe&&K.mapping,envMapCubeUVHeight:H,aoMap:z,lightMap:nt,bumpMap:be,normalMap:J,displacementMap:h&&ce,emissiveMap:ge,normalMapObjectSpace:J&&y.normalMapType===vd,normalMapTangentSpace:J&&y.normalMapType===md,metalnessMap:pe,roughnessMap:R,anisotropy:b,anisotropyMap:O,clearcoat:k,clearcoatMap:he,clearcoatNormalMap:Ae,clearcoatRoughnessMap:ee,dispersion:Q,iridescence:N,iridescenceMap:me,iridescenceThicknessMap:Ce,sheen:G,sheenColorMap:Ie,sheenRoughnessMap:Me,specularMap:Ye,specularColorMap:ne,specularIntensityMap:Se,transmission:te,transmissionMap:L,thicknessMap:ae,gradientMap:V,opaque:y.transparent===!1&&y.blending===Yt&&y.alphaToCoverage===!1,alphaMap:$,alphaTest:oe,alphaHash:re,combine:y.combine,mapUv:Je&&x(y.map.channel),aoMapUv:z&&x(y.aoMap.channel),lightMapUv:nt&&x(y.lightMap.channel),bumpMapUv:be&&x(y.bumpMap.channel),normalMapUv:J&&x(y.normalMap.channel),displacementMapUv:ce&&x(y.displacementMap.channel),emissiveMapUv:ge&&x(y.emissiveMap.channel),metalnessMapUv:pe&&x(y.metalnessMap.channel),roughnessMapUv:R&&x(y.roughnessMap.channel),anisotropyMapUv:O&&x(y.anisotropyMap.channel),clearcoatMapUv:he&&x(y.clearcoatMap.channel),clearcoatNormalMapUv:Ae&&x(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ee&&x(y.clearcoatRoughnessMap.channel),iridescenceMapUv:me&&x(y.iridescenceMap.channel),iridescenceThicknessMapUv:Ce&&x(y.iridescenceThicknessMap.channel),sheenColorMapUv:Ie&&x(y.sheenColorMap.channel),sheenRoughnessMapUv:Me&&x(y.sheenRoughnessMap.channel),specularMapUv:Ye&&x(y.specularMap.channel),specularColorMapUv:ne&&x(y.specularColorMap.channel),specularIntensityMapUv:Se&&x(y.specularIntensityMap.channel),transmissionMapUv:L&&x(y.transmissionMap.channel),thicknessMapUv:ae&&x(y.thicknessMap.channel),alphaMapUv:$&&x(y.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(J||b),vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!q.attributes.uv&&(Je||$),fog:!!X,useFog:y.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:y.flatShading===!0,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:we,skinning:F.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:de,morphTextureStride:_e,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:y.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:We,decodeVideoTexture:Je&&y.map.isVideoTexture===!0&&ht.getTransfer(y.map.colorSpace)===St,decodeVideoTextureEmissive:ge&&y.emissiveMap.isVideoTexture===!0&&ht.getTransfer(y.emissiveMap.colorSpace)===St,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Bt,flipSided:y.side===Lt,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:ye&&y.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ye&&y.extensions.multiDraw===!0||qe)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return Ne.vertexUv1s=c.has(1),Ne.vertexUv2s=c.has(2),Ne.vertexUv3s=c.has(3),c.clear(),Ne}function u(y){const _=[];if(y.shaderID?_.push(y.shaderID):(_.push(y.customVertexShaderID),_.push(y.customFragmentShaderID)),y.defines!==void 0)for(const P in y.defines)_.push(P),_.push(y.defines[P]);return y.isRawShaderMaterial===!1&&(M(_,y),S(_,y),_.push(n.outputColorSpace)),_.push(y.customProgramCacheKey),_.join()}function M(y,_){y.push(_.precision),y.push(_.outputColorSpace),y.push(_.envMapMode),y.push(_.envMapCubeUVHeight),y.push(_.mapUv),y.push(_.alphaMapUv),y.push(_.lightMapUv),y.push(_.aoMapUv),y.push(_.bumpMapUv),y.push(_.normalMapUv),y.push(_.displacementMapUv),y.push(_.emissiveMapUv),y.push(_.metalnessMapUv),y.push(_.roughnessMapUv),y.push(_.anisotropyMapUv),y.push(_.clearcoatMapUv),y.push(_.clearcoatNormalMapUv),y.push(_.clearcoatRoughnessMapUv),y.push(_.iridescenceMapUv),y.push(_.iridescenceThicknessMapUv),y.push(_.sheenColorMapUv),y.push(_.sheenRoughnessMapUv),y.push(_.specularMapUv),y.push(_.specularColorMapUv),y.push(_.specularIntensityMapUv),y.push(_.transmissionMapUv),y.push(_.thicknessMapUv),y.push(_.combine),y.push(_.fogExp2),y.push(_.sizeAttenuation),y.push(_.morphTargetsCount),y.push(_.morphAttributeCount),y.push(_.numDirLights),y.push(_.numPointLights),y.push(_.numSpotLights),y.push(_.numSpotLightMaps),y.push(_.numHemiLights),y.push(_.numRectAreaLights),y.push(_.numDirLightShadows),y.push(_.numPointLightShadows),y.push(_.numSpotLightShadows),y.push(_.numSpotLightShadowsWithMaps),y.push(_.numLightProbes),y.push(_.shadowMapType),y.push(_.toneMapping),y.push(_.numClippingPlanes),y.push(_.numClipIntersection),y.push(_.depthPacking)}function S(y,_){s.disableAll(),_.supportsVertexTextures&&s.enable(0),_.instancing&&s.enable(1),_.instancingColor&&s.enable(2),_.instancingMorph&&s.enable(3),_.matcap&&s.enable(4),_.envMap&&s.enable(5),_.normalMapObjectSpace&&s.enable(6),_.normalMapTangentSpace&&s.enable(7),_.clearcoat&&s.enable(8),_.iridescence&&s.enable(9),_.alphaTest&&s.enable(10),_.vertexColors&&s.enable(11),_.vertexAlphas&&s.enable(12),_.vertexUv1s&&s.enable(13),_.vertexUv2s&&s.enable(14),_.vertexUv3s&&s.enable(15),_.vertexTangents&&s.enable(16),_.anisotropy&&s.enable(17),_.alphaHash&&s.enable(18),_.batching&&s.enable(19),_.dispersion&&s.enable(20),_.batchingColor&&s.enable(21),y.push(s.mask),s.disableAll(),_.fog&&s.enable(0),_.useFog&&s.enable(1),_.flatShading&&s.enable(2),_.logarithmicDepthBuffer&&s.enable(3),_.reverseDepthBuffer&&s.enable(4),_.skinning&&s.enable(5),_.morphTargets&&s.enable(6),_.morphNormals&&s.enable(7),_.morphColors&&s.enable(8),_.premultipliedAlpha&&s.enable(9),_.shadowMapEnabled&&s.enable(10),_.doubleSided&&s.enable(11),_.flipSided&&s.enable(12),_.useDepthPacking&&s.enable(13),_.dithering&&s.enable(14),_.transmission&&s.enable(15),_.sheen&&s.enable(16),_.opaque&&s.enable(17),_.pointsUvs&&s.enable(18),_.decodeVideoTexture&&s.enable(19),_.decodeVideoTextureEmissive&&s.enable(20),_.alphaToCoverage&&s.enable(21),y.push(s.mask)}function v(y){const _=g[y.type];let P;if(_){const I=Tn[_];P=Xa.clone(I.uniforms)}else P=y.uniforms;return P}function T(y,_){let P;for(let I=0,F=f.length;I<F;I++){const X=f[I];if(X.cacheKey===_){P=X,++P.usedTimes;break}}return P===void 0&&(P=new om(n,_,y,r),f.push(P)),P}function w(y){if(--y.usedTimes===0){const _=f.indexOf(y);f[_]=f[f.length-1],f.pop(),y.destroy()}}function E(y){l.remove(y)}function C(){l.dispose()}return{getParameters:m,getProgramCacheKey:u,getUniforms:v,acquireProgram:T,releaseProgram:w,releaseShaderCache:E,programs:f,dispose:C}}function dm(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let s=n.get(o);return s===void 0&&(s={},n.set(o,s)),s}function i(o){n.delete(o)}function a(o,s,l){n.get(o)[s]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:a,dispose:r}}function hm(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function sc(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function lc(){const n=[];let e=0;const t=[],i=[],a=[];function r(){e=0,t.length=0,i.length=0,a.length=0}function o(d,h,p,g,x,m){let u=n[e];return u===void 0?(u={id:d.id,object:d,geometry:h,material:p,groupOrder:g,renderOrder:d.renderOrder,z:x,group:m},n[e]=u):(u.id=d.id,u.object=d,u.geometry=h,u.material=p,u.groupOrder=g,u.renderOrder=d.renderOrder,u.z=x,u.group=m),e++,u}function s(d,h,p,g,x,m){const u=o(d,h,p,g,x,m);p.transmission>0?i.push(u):p.transparent===!0?a.push(u):t.push(u)}function l(d,h,p,g,x,m){const u=o(d,h,p,g,x,m);p.transmission>0?i.unshift(u):p.transparent===!0?a.unshift(u):t.unshift(u)}function c(d,h){t.length>1&&t.sort(d||hm),i.length>1&&i.sort(h||sc),a.length>1&&a.sort(h||sc)}function f(){for(let d=e,h=n.length;d<h;d++){const p=n[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:a,init:r,push:s,unshift:l,finish:f,sort:c}}function fm(){let n=new WeakMap;function e(i,a){const r=n.get(i);let o;return r===void 0?(o=new lc,n.set(i,[o])):a>=r.length?(o=new lc,r.push(o)):o=r[a],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function pm(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new lt};break;case"SpotLight":t={position:new D,direction:new D,color:new lt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new lt,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new lt,groundColor:new lt};break;case"RectAreaLight":t={color:new lt,position:new D,halfWidth:new D,halfHeight:new D};break}return n[e.id]=t,t}}}function mm(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Le};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Le};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Le,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let vm=0;function gm(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function xm(n){const e=new pm,t=mm(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new D);const a=new D,r=new yt,o=new yt;function s(c){let f=0,d=0,h=0;for(let y=0;y<9;y++)i.probe[y].set(0,0,0);let p=0,g=0,x=0,m=0,u=0,M=0,S=0,v=0,T=0,w=0,E=0;c.sort(gm);for(let y=0,_=c.length;y<_;y++){const P=c[y],I=P.color,F=P.intensity,X=P.distance,q=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)f+=I.r*F,d+=I.g*F,h+=I.b*F;else if(P.isLightProbe){for(let B=0;B<9;B++)i.probe[B].addScaledVector(P.sh.coefficients[B],F);E++}else if(P.isDirectionalLight){const B=e.get(P);if(B.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const K=P.shadow,H=t.get(P);H.shadowIntensity=K.intensity,H.shadowBias=K.bias,H.shadowNormalBias=K.normalBias,H.shadowRadius=K.radius,H.shadowMapSize=K.mapSize,i.directionalShadow[p]=H,i.directionalShadowMap[p]=q,i.directionalShadowMatrix[p]=P.shadow.matrix,M++}i.directional[p]=B,p++}else if(P.isSpotLight){const B=e.get(P);B.position.setFromMatrixPosition(P.matrixWorld),B.color.copy(I).multiplyScalar(F),B.distance=X,B.coneCos=Math.cos(P.angle),B.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),B.decay=P.decay,i.spot[x]=B;const K=P.shadow;if(P.map&&(i.spotLightMap[T]=P.map,T++,K.updateMatrices(P),P.castShadow&&w++),i.spotLightMatrix[x]=K.matrix,P.castShadow){const H=t.get(P);H.shadowIntensity=K.intensity,H.shadowBias=K.bias,H.shadowNormalBias=K.normalBias,H.shadowRadius=K.radius,H.shadowMapSize=K.mapSize,i.spotShadow[x]=H,i.spotShadowMap[x]=q,v++}x++}else if(P.isRectAreaLight){const B=e.get(P);B.color.copy(I).multiplyScalar(F),B.halfWidth.set(P.width*.5,0,0),B.halfHeight.set(0,P.height*.5,0),i.rectArea[m]=B,m++}else if(P.isPointLight){const B=e.get(P);if(B.color.copy(P.color).multiplyScalar(P.intensity),B.distance=P.distance,B.decay=P.decay,P.castShadow){const K=P.shadow,H=t.get(P);H.shadowIntensity=K.intensity,H.shadowBias=K.bias,H.shadowNormalBias=K.normalBias,H.shadowRadius=K.radius,H.shadowMapSize=K.mapSize,H.shadowCameraNear=K.camera.near,H.shadowCameraFar=K.camera.far,i.pointShadow[g]=H,i.pointShadowMap[g]=q,i.pointShadowMatrix[g]=P.shadow.matrix,S++}i.point[g]=B,g++}else if(P.isHemisphereLight){const B=e.get(P);B.skyColor.copy(P.color).multiplyScalar(F),B.groundColor.copy(P.groundColor).multiplyScalar(F),i.hemi[u]=B,u++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Pe.LTC_FLOAT_1,i.rectAreaLTC2=Pe.LTC_FLOAT_2):(i.rectAreaLTC1=Pe.LTC_HALF_1,i.rectAreaLTC2=Pe.LTC_HALF_2)),i.ambient[0]=f,i.ambient[1]=d,i.ambient[2]=h;const C=i.hash;(C.directionalLength!==p||C.pointLength!==g||C.spotLength!==x||C.rectAreaLength!==m||C.hemiLength!==u||C.numDirectionalShadows!==M||C.numPointShadows!==S||C.numSpotShadows!==v||C.numSpotMaps!==T||C.numLightProbes!==E)&&(i.directional.length=p,i.spot.length=x,i.rectArea.length=m,i.point.length=g,i.hemi.length=u,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=S,i.pointShadowMap.length=S,i.spotShadow.length=v,i.spotShadowMap.length=v,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=S,i.spotLightMatrix.length=v+T-w,i.spotLightMap.length=T,i.numSpotLightShadowsWithMaps=w,i.numLightProbes=E,C.directionalLength=p,C.pointLength=g,C.spotLength=x,C.rectAreaLength=m,C.hemiLength=u,C.numDirectionalShadows=M,C.numPointShadows=S,C.numSpotShadows=v,C.numSpotMaps=T,C.numLightProbes=E,i.version=vm++)}function l(c,f){let d=0,h=0,p=0,g=0,x=0;const m=f.matrixWorldInverse;for(let u=0,M=c.length;u<M;u++){const S=c[u];if(S.isDirectionalLight){const v=i.directional[d];v.direction.setFromMatrixPosition(S.matrixWorld),a.setFromMatrixPosition(S.target.matrixWorld),v.direction.sub(a),v.direction.transformDirection(m),d++}else if(S.isSpotLight){const v=i.spot[p];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(S.matrixWorld),a.setFromMatrixPosition(S.target.matrixWorld),v.direction.sub(a),v.direction.transformDirection(m),p++}else if(S.isRectAreaLight){const v=i.rectArea[g];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(m),o.identity(),r.copy(S.matrixWorld),r.premultiply(m),o.extractRotation(r),v.halfWidth.set(S.width*.5,0,0),v.halfHeight.set(0,S.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),g++}else if(S.isPointLight){const v=i.point[h];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(m),h++}else if(S.isHemisphereLight){const v=i.hemi[x];v.direction.setFromMatrixPosition(S.matrixWorld),v.direction.transformDirection(m),x++}}}return{setup:s,setupView:l,state:i}}function cc(n){const e=new xm(n),t=[],i=[];function a(f){c.camera=f,t.length=0,i.length=0}function r(f){t.push(f)}function o(f){i.push(f)}function s(){e.setup(t)}function l(f){e.setupView(t,f)}const c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:a,state:c,setupLights:s,setupLightsView:l,pushLight:r,pushShadow:o}}function _m(n){let e=new WeakMap;function t(a,r=0){const o=e.get(a);let s;return o===void 0?(s=new cc(n),e.set(a,[s])):r>=o.length?(s=new cc(n),o.push(s)):s=o[r],s}function i(){e=new WeakMap}return{get:t,dispose:i}}class ym extends ja{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=fd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Mm extends ja{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Sm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,wm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function bm(n,e,t){let i=new Ks;const a=new Le,r=new Le,o=new wt,s=new ym({depthPacking:pd}),l=new Mm,c={},f=t.maxTextureSize,d={[Xn]:Lt,[Lt]:Xn,[Bt]:Bt},h=new Ke({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Le},radius:{value:4}},vertexShader:Sm,fragmentShader:wm}),p=h.clone();p.defines.HORIZONTAL_PASS=1;const g=new st;g.setAttribute("position",new De(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new ut(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Kc;let u=this.type;this.render=function(w,E,C){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;const y=n.getRenderTarget(),_=n.getActiveCubeFace(),P=n.getActiveMipmapLevel(),I=n.state;I.setBlending(Wn),I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);const F=u!==Un&&this.type===Un,X=u===Un&&this.type!==Un;for(let q=0,B=w.length;q<B;q++){const K=w[q],H=K.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",K,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;a.copy(H.mapSize);const se=H.getFrameExtents();if(a.multiply(se),r.copy(H.mapSize),(a.x>f||a.y>f)&&(a.x>f&&(r.x=Math.floor(f/se.x),a.x=r.x*se.x,H.mapSize.x=r.x),a.y>f&&(r.y=Math.floor(f/se.y),a.y=r.y*se.y,H.mapSize.y=r.y)),H.map===null||F===!0||X===!0){const de=this.type!==Un?{minFilter:un,magFilter:un}:{};H.map!==null&&H.map.dispose(),H.map=new vn(a.x,a.y,de),H.map.texture.name=K.name+".shadowMap",H.camera.updateProjectionMatrix()}n.setRenderTarget(H.map),n.clear();const ue=H.getViewportCount();for(let de=0;de<ue;de++){const _e=H.getViewport(de);o.set(r.x*_e.x,r.y*_e.y,r.x*_e.z,r.y*_e.w),I.viewport(o),H.updateMatrices(K,de),i=H.getFrustum(),v(E,C,H.camera,K,this.type)}H.isPointLightShadow!==!0&&this.type===Un&&M(H,C),H.needsUpdate=!1}u=this.type,m.needsUpdate=!1,n.setRenderTarget(y,_,P)};function M(w,E){const C=e.update(x);h.defines.VSM_SAMPLES!==w.blurSamples&&(h.defines.VSM_SAMPLES=w.blurSamples,p.defines.VSM_SAMPLES=w.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new vn(a.x,a.y)),h.uniforms.shadow_pass.value=w.map.texture,h.uniforms.resolution.value=w.mapSize,h.uniforms.radius.value=w.radius,n.setRenderTarget(w.mapPass),n.clear(),n.renderBufferDirect(E,null,C,h,x,null),p.uniforms.shadow_pass.value=w.mapPass.texture,p.uniforms.resolution.value=w.mapSize,p.uniforms.radius.value=w.radius,n.setRenderTarget(w.map),n.clear(),n.renderBufferDirect(E,null,C,p,x,null)}function S(w,E,C,y){let _=null;const P=C.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(P!==void 0)_=P;else if(_=C.isPointLight===!0?l:s,n.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){const I=_.uuid,F=E.uuid;let X=c[I];X===void 0&&(X={},c[I]=X);let q=X[F];q===void 0&&(q=_.clone(),X[F]=q,E.addEventListener("dispose",T)),_=q}if(_.visible=E.visible,_.wireframe=E.wireframe,y===Un?_.side=E.shadowSide!==null?E.shadowSide:E.side:_.side=E.shadowSide!==null?E.shadowSide:d[E.side],_.alphaMap=E.alphaMap,_.alphaTest=E.alphaTest,_.map=E.map,_.clipShadows=E.clipShadows,_.clippingPlanes=E.clippingPlanes,_.clipIntersection=E.clipIntersection,_.displacementMap=E.displacementMap,_.displacementScale=E.displacementScale,_.displacementBias=E.displacementBias,_.wireframeLinewidth=E.wireframeLinewidth,_.linewidth=E.linewidth,C.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const I=n.properties.get(_);I.light=C}return _}function v(w,E,C,y,_){if(w.visible===!1)return;if(w.layers.test(E.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&_===Un)&&(!w.frustumCulled||i.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,w.matrixWorld);const F=e.update(w),X=w.material;if(Array.isArray(X)){const q=F.groups;for(let B=0,K=q.length;B<K;B++){const H=q[B],se=X[H.materialIndex];if(se&&se.visible){const ue=S(w,se,y,_);w.onBeforeShadow(n,w,E,C,F,ue,H),n.renderBufferDirect(C,null,F,ue,w,H),w.onAfterShadow(n,w,E,C,F,ue,H)}}}else if(X.visible){const q=S(w,X,y,_);w.onBeforeShadow(n,w,E,C,F,q,null),n.renderBufferDirect(C,null,F,q,w,null),w.onAfterShadow(n,w,E,C,F,q,null)}}const I=w.children;for(let F=0,X=I.length;F<X;F++)v(I[F],E,C,y,_)}function T(w){w.target.removeEventListener("dispose",T);for(const C in c){const y=c[C],_=w.target.uuid;_ in y&&(y[_].dispose(),delete y[_])}}}const Tm={[$o]:Ko,[Jo]:ts,[Qo]:ns,[ca]:es,[Ko]:$o,[ts]:Jo,[ns]:Qo,[es]:ca};function Am(n,e){function t(){let L=!1;const ae=new wt;let V=null;const $=new wt(0,0,0,0);return{setMask:function(oe){V!==oe&&!L&&(n.colorMask(oe,oe,oe,oe),V=oe)},setLocked:function(oe){L=oe},setClear:function(oe,re,ye,We,Ne){Ne===!0&&(oe*=We,re*=We,ye*=We),ae.set(oe,re,ye,We),$.equals(ae)===!1&&(n.clearColor(oe,re,ye,We),$.copy(ae))},reset:function(){L=!1,V=null,$.set(-1,0,0,0)}}}function i(){let L=!1,ae=!1,V=null,$=null,oe=null;return{setReversed:function(re){if(ae!==re){const ye=e.get("EXT_clip_control");ae?ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.ZERO_TO_ONE_EXT):ye.clipControlEXT(ye.LOWER_LEFT_EXT,ye.NEGATIVE_ONE_TO_ONE_EXT);const We=oe;oe=null,this.setClear(We)}ae=re},getReversed:function(){return ae},setTest:function(re){re?fe(n.DEPTH_TEST):we(n.DEPTH_TEST)},setMask:function(re){V!==re&&!L&&(n.depthMask(re),V=re)},setFunc:function(re){if(ae&&(re=Tm[re]),$!==re){switch(re){case $o:n.depthFunc(n.NEVER);break;case Ko:n.depthFunc(n.ALWAYS);break;case Jo:n.depthFunc(n.LESS);break;case ca:n.depthFunc(n.LEQUAL);break;case Qo:n.depthFunc(n.EQUAL);break;case es:n.depthFunc(n.GEQUAL);break;case ts:n.depthFunc(n.GREATER);break;case ns:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}$=re}},setLocked:function(re){L=re},setClear:function(re){oe!==re&&(ae&&(re=1-re),n.clearDepth(re),oe=re)},reset:function(){L=!1,V=null,$=null,oe=null,ae=!1}}}function a(){let L=!1,ae=null,V=null,$=null,oe=null,re=null,ye=null,We=null,Ne=null;return{setTest:function(Ee){L||(Ee?fe(n.STENCIL_TEST):we(n.STENCIL_TEST))},setMask:function(Ee){ae!==Ee&&!L&&(n.stencilMask(Ee),ae=Ee)},setFunc:function(Ee,Ge,Ze){(V!==Ee||$!==Ge||oe!==Ze)&&(n.stencilFunc(Ee,Ge,Ze),V=Ee,$=Ge,oe=Ze)},setOp:function(Ee,Ge,Ze){(re!==Ee||ye!==Ge||We!==Ze)&&(n.stencilOp(Ee,Ge,Ze),re=Ee,ye=Ge,We=Ze)},setLocked:function(Ee){L=Ee},setClear:function(Ee){Ne!==Ee&&(n.clearStencil(Ee),Ne=Ee)},reset:function(){L=!1,ae=null,V=null,$=null,oe=null,re=null,ye=null,We=null,Ne=null}}}const r=new t,o=new i,s=new a,l=new WeakMap,c=new WeakMap;let f={},d={},h=new WeakMap,p=[],g=null,x=!1,m=null,u=null,M=null,S=null,v=null,T=null,w=null,E=new lt(0,0,0),C=0,y=!1,_=null,P=null,I=null,F=null,X=null;const q=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let B=!1,K=0;const H=n.getParameter(n.VERSION);H.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(H)[1]),B=K>=1):H.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),B=K>=2);let se=null,ue={};const de=n.getParameter(n.SCISSOR_BOX),_e=n.getParameter(n.VIEWPORT),Re=new wt().fromArray(de),j=new wt().fromArray(_e);function le(L,ae,V,$){const oe=new Uint8Array(4),re=n.createTexture();n.bindTexture(L,re),n.texParameteri(L,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(L,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ye=0;ye<V;ye++)L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY?n.texImage3D(ae,0,n.RGBA,1,1,$,0,n.RGBA,n.UNSIGNED_BYTE,oe):n.texImage2D(ae+ye,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,oe);return re}const Te={};Te[n.TEXTURE_2D]=le(n.TEXTURE_2D,n.TEXTURE_2D,1),Te[n.TEXTURE_CUBE_MAP]=le(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Te[n.TEXTURE_2D_ARRAY]=le(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Te[n.TEXTURE_3D]=le(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),s.setClear(0),fe(n.DEPTH_TEST),o.setFunc(ca),be(!1),J(pl),fe(n.CULL_FACE),z(Wn);function fe(L){f[L]!==!0&&(n.enable(L),f[L]=!0)}function we(L){f[L]!==!1&&(n.disable(L),f[L]=!1)}function ve(L,ae){return d[L]!==ae?(n.bindFramebuffer(L,ae),d[L]=ae,L===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=ae),L===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=ae),!0):!1}function qe(L,ae){let V=p,$=!1;if(L){V=h.get(ae),V===void 0&&(V=[],h.set(ae,V));const oe=L.textures;if(V.length!==oe.length||V[0]!==n.COLOR_ATTACHMENT0){for(let re=0,ye=oe.length;re<ye;re++)V[re]=n.COLOR_ATTACHMENT0+re;V.length=oe.length,$=!0}}else V[0]!==n.BACK&&(V[0]=n.BACK,$=!0);$&&n.drawBuffers(V)}function Je(L){return g!==L?(n.useProgram(L),g=L,!0):!1}const $e={[bi]:n.FUNC_ADD,[qu]:n.FUNC_SUBTRACT,[Yu]:n.FUNC_REVERSE_SUBTRACT};$e[Zu]=n.MIN,$e[ju]=n.MAX;const Qe={[$u]:n.ZERO,[Ku]:n.ONE,[Ju]:n.SRC_COLOR,[Zo]:n.SRC_ALPHA,[ad]:n.SRC_ALPHA_SATURATE,[nd]:n.DST_COLOR,[ed]:n.DST_ALPHA,[Qu]:n.ONE_MINUS_SRC_COLOR,[jo]:n.ONE_MINUS_SRC_ALPHA,[id]:n.ONE_MINUS_DST_COLOR,[td]:n.ONE_MINUS_DST_ALPHA,[rd]:n.CONSTANT_COLOR,[od]:n.ONE_MINUS_CONSTANT_COLOR,[sd]:n.CONSTANT_ALPHA,[ld]:n.ONE_MINUS_CONSTANT_ALPHA};function z(L,ae,V,$,oe,re,ye,We,Ne,Ee){if(L===Wn){x===!0&&(we(n.BLEND),x=!1);return}if(x===!1&&(fe(n.BLEND),x=!0),L!==Xu){if(L!==m||Ee!==y){if((u!==bi||v!==bi)&&(n.blendEquation(n.FUNC_ADD),u=bi,v=bi),Ee)switch(L){case Yt:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Pi:n.blendFunc(n.ONE,n.ONE);break;case ml:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case vl:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case Yt:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Pi:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case ml:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case vl:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}M=null,S=null,T=null,w=null,E.set(0,0,0),C=0,m=L,y=Ee}return}oe=oe||ae,re=re||V,ye=ye||$,(ae!==u||oe!==v)&&(n.blendEquationSeparate($e[ae],$e[oe]),u=ae,v=oe),(V!==M||$!==S||re!==T||ye!==w)&&(n.blendFuncSeparate(Qe[V],Qe[$],Qe[re],Qe[ye]),M=V,S=$,T=re,w=ye),(We.equals(E)===!1||Ne!==C)&&(n.blendColor(We.r,We.g,We.b,Ne),E.copy(We),C=Ne),m=L,y=!1}function nt(L,ae){L.side===Bt?we(n.CULL_FACE):fe(n.CULL_FACE);let V=L.side===Lt;ae&&(V=!V),be(V),L.blending===Yt&&L.transparent===!1?z(Wn):z(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),o.setFunc(L.depthFunc),o.setTest(L.depthTest),o.setMask(L.depthWrite),r.setMask(L.colorWrite);const $=L.stencilWrite;s.setTest($),$&&(s.setMask(L.stencilWriteMask),s.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),s.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),ge(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?fe(n.SAMPLE_ALPHA_TO_COVERAGE):we(n.SAMPLE_ALPHA_TO_COVERAGE)}function be(L){_!==L&&(L?n.frontFace(n.CW):n.frontFace(n.CCW),_=L)}function J(L){L!==Wu?(fe(n.CULL_FACE),L!==P&&(L===pl?n.cullFace(n.BACK):L===Gu?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):we(n.CULL_FACE),P=L}function ce(L){L!==I&&(B&&n.lineWidth(L),I=L)}function ge(L,ae,V){L?(fe(n.POLYGON_OFFSET_FILL),(F!==ae||X!==V)&&(n.polygonOffset(ae,V),F=ae,X=V)):we(n.POLYGON_OFFSET_FILL)}function pe(L){L?fe(n.SCISSOR_TEST):we(n.SCISSOR_TEST)}function R(L){L===void 0&&(L=n.TEXTURE0+q-1),se!==L&&(n.activeTexture(L),se=L)}function b(L,ae,V){V===void 0&&(se===null?V=n.TEXTURE0+q-1:V=se);let $=ue[V];$===void 0&&($={type:void 0,texture:void 0},ue[V]=$),($.type!==L||$.texture!==ae)&&(se!==V&&(n.activeTexture(V),se=V),n.bindTexture(L,ae||Te[L]),$.type=L,$.texture=ae)}function k(){const L=ue[se];L!==void 0&&L.type!==void 0&&(n.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function Q(){try{n.compressedTexImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function N(){try{n.compressedTexImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function G(){try{n.texSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function te(){try{n.texSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function O(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function he(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ae(){try{n.texStorage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ee(){try{n.texStorage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function me(){try{n.texImage2D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ce(){try{n.texImage3D.apply(n,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ie(L){Re.equals(L)===!1&&(n.scissor(L.x,L.y,L.z,L.w),Re.copy(L))}function Me(L){j.equals(L)===!1&&(n.viewport(L.x,L.y,L.z,L.w),j.copy(L))}function Ye(L,ae){let V=c.get(ae);V===void 0&&(V=new WeakMap,c.set(ae,V));let $=V.get(L);$===void 0&&($=n.getUniformBlockIndex(ae,L.name),V.set(L,$))}function ne(L,ae){const $=c.get(ae).get(L);l.get(ae)!==$&&(n.uniformBlockBinding(ae,$,L.__bindingPointIndex),l.set(ae,$))}function Se(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),f={},se=null,ue={},d={},h=new WeakMap,p=[],g=null,x=!1,m=null,u=null,M=null,S=null,v=null,T=null,w=null,E=new lt(0,0,0),C=0,y=!1,_=null,P=null,I=null,F=null,X=null,Re.set(0,0,n.canvas.width,n.canvas.height),j.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),s.reset()}return{buffers:{color:r,depth:o,stencil:s},enable:fe,disable:we,bindFramebuffer:ve,drawBuffers:qe,useProgram:Je,setBlending:z,setMaterial:nt,setFlipSided:be,setCullFace:J,setLineWidth:ce,setPolygonOffset:ge,setScissorTest:pe,activeTexture:R,bindTexture:b,unbindTexture:k,compressedTexImage2D:Q,compressedTexImage3D:N,texImage2D:me,texImage3D:Ce,updateUBOMapping:Ye,uniformBlockBinding:ne,texStorage2D:Ae,texStorage3D:ee,texSubImage2D:G,texSubImage3D:te,compressedTexSubImage2D:O,compressedTexSubImage3D:he,scissor:Ie,viewport:Me,reset:Se}}function uc(n,e,t,i){const a=Em(i);switch(t){case lu:return n*e;case uu:return n*e;case du:return n*e*2;case Xs:return n*e/a.components*a.byteLength;case qs:return n*e/a.components*a.byteLength;case hu:return n*e*2/a.components*a.byteLength;case Ys:return n*e*2/a.components*a.byteLength;case cu:return n*e*3/a.components*a.byteLength;case Sn:return n*e*4/a.components*a.byteLength;case Zs:return n*e*4/a.components*a.byteLength;case Ur:case zr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Or:case Br:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ls:case us:return Math.max(n,16)*Math.max(e,8)/4;case ss:case cs:return Math.max(n,8)*Math.max(e,8)/2;case ds:case hs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case fs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ps:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ms:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case vs:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case gs:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case xs:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case _s:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case ys:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Ms:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Ss:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case ws:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case bs:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Ts:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case As:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Es:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case kr:case Cs:case Ps:return Math.ceil(n/4)*Math.ceil(e/4)*16;case fu:case Rs:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Ds:case Ls:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Em(n){switch(n){case qn:case ru:return{byteLength:1,components:1};case Ha:case ou:case Pn:return{byteLength:2,components:1};case Gs:case Hs:return{byteLength:2,components:4};case Ri:case Ws:case Cn:return{byteLength:4,components:1};case su:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}function Cm(n,e,t,i,a,r,o){const s=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Le,f=new WeakMap;let d;const h=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,b){return p?new OffscreenCanvas(R,b):Yr("canvas")}function x(R,b,k){let Q=1;const N=pe(R);if((N.width>k||N.height>k)&&(Q=k/Math.max(N.width,N.height)),Q<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const G=Math.floor(Q*N.width),te=Math.floor(Q*N.height);d===void 0&&(d=g(G,te));const O=b?g(G,te):d;return O.width=G,O.height=te,O.getContext("2d").drawImage(R,0,0,G,te),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+N.width+"x"+N.height+") to ("+G+"x"+te+")."),O}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+N.width+"x"+N.height+")."),R;return R}function m(R){return R.generateMipmaps}function u(R){n.generateMipmap(R)}function M(R){return R.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?n.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function S(R,b,k,Q,N=!1){if(R!==null){if(n[R]!==void 0)return n[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let G=b;if(b===n.RED&&(k===n.FLOAT&&(G=n.R32F),k===n.HALF_FLOAT&&(G=n.R16F),k===n.UNSIGNED_BYTE&&(G=n.R8)),b===n.RED_INTEGER&&(k===n.UNSIGNED_BYTE&&(G=n.R8UI),k===n.UNSIGNED_SHORT&&(G=n.R16UI),k===n.UNSIGNED_INT&&(G=n.R32UI),k===n.BYTE&&(G=n.R8I),k===n.SHORT&&(G=n.R16I),k===n.INT&&(G=n.R32I)),b===n.RG&&(k===n.FLOAT&&(G=n.RG32F),k===n.HALF_FLOAT&&(G=n.RG16F),k===n.UNSIGNED_BYTE&&(G=n.RG8)),b===n.RG_INTEGER&&(k===n.UNSIGNED_BYTE&&(G=n.RG8UI),k===n.UNSIGNED_SHORT&&(G=n.RG16UI),k===n.UNSIGNED_INT&&(G=n.RG32UI),k===n.BYTE&&(G=n.RG8I),k===n.SHORT&&(G=n.RG16I),k===n.INT&&(G=n.RG32I)),b===n.RGB_INTEGER&&(k===n.UNSIGNED_BYTE&&(G=n.RGB8UI),k===n.UNSIGNED_SHORT&&(G=n.RGB16UI),k===n.UNSIGNED_INT&&(G=n.RGB32UI),k===n.BYTE&&(G=n.RGB8I),k===n.SHORT&&(G=n.RGB16I),k===n.INT&&(G=n.RGB32I)),b===n.RGBA_INTEGER&&(k===n.UNSIGNED_BYTE&&(G=n.RGBA8UI),k===n.UNSIGNED_SHORT&&(G=n.RGBA16UI),k===n.UNSIGNED_INT&&(G=n.RGBA32UI),k===n.BYTE&&(G=n.RGBA8I),k===n.SHORT&&(G=n.RGBA16I),k===n.INT&&(G=n.RGBA32I)),b===n.RGB&&k===n.UNSIGNED_INT_5_9_9_9_REV&&(G=n.RGB9_E5),b===n.RGBA){const te=N?Qr:ht.getTransfer(Q);k===n.FLOAT&&(G=n.RGBA32F),k===n.HALF_FLOAT&&(G=n.RGBA16F),k===n.UNSIGNED_BYTE&&(G=te===St?n.SRGB8_ALPHA8:n.RGBA8),k===n.UNSIGNED_SHORT_4_4_4_4&&(G=n.RGBA4),k===n.UNSIGNED_SHORT_5_5_5_1&&(G=n.RGB5_A1)}return(G===n.R16F||G===n.R32F||G===n.RG16F||G===n.RG32F||G===n.RGBA16F||G===n.RGBA32F)&&e.get("EXT_color_buffer_float"),G}function v(R,b){let k;return R?b===null||b===Ri||b===ha?k=n.DEPTH24_STENCIL8:b===Cn?k=n.DEPTH32F_STENCIL8:b===Ha&&(k=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===Ri||b===ha?k=n.DEPTH_COMPONENT24:b===Cn?k=n.DEPTH_COMPONENT32F:b===Ha&&(k=n.DEPTH_COMPONENT16),k}function T(R,b){return m(R)===!0||R.isFramebufferTexture&&R.minFilter!==un&&R.minFilter!==En?Math.log2(Math.max(b.width,b.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?b.mipmaps.length:1}function w(R){const b=R.target;b.removeEventListener("dispose",w),C(b),b.isVideoTexture&&f.delete(b)}function E(R){const b=R.target;b.removeEventListener("dispose",E),_(b)}function C(R){const b=i.get(R);if(b.__webglInit===void 0)return;const k=R.source,Q=h.get(k);if(Q){const N=Q[b.__cacheKey];N.usedTimes--,N.usedTimes===0&&y(R),Object.keys(Q).length===0&&h.delete(k)}i.remove(R)}function y(R){const b=i.get(R);n.deleteTexture(b.__webglTexture);const k=R.source,Q=h.get(k);delete Q[b.__cacheKey],o.memory.textures--}function _(R){const b=i.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),i.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(b.__webglFramebuffer[Q]))for(let N=0;N<b.__webglFramebuffer[Q].length;N++)n.deleteFramebuffer(b.__webglFramebuffer[Q][N]);else n.deleteFramebuffer(b.__webglFramebuffer[Q]);b.__webglDepthbuffer&&n.deleteRenderbuffer(b.__webglDepthbuffer[Q])}else{if(Array.isArray(b.__webglFramebuffer))for(let Q=0;Q<b.__webglFramebuffer.length;Q++)n.deleteFramebuffer(b.__webglFramebuffer[Q]);else n.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&n.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&n.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let Q=0;Q<b.__webglColorRenderbuffer.length;Q++)b.__webglColorRenderbuffer[Q]&&n.deleteRenderbuffer(b.__webglColorRenderbuffer[Q]);b.__webglDepthRenderbuffer&&n.deleteRenderbuffer(b.__webglDepthRenderbuffer)}const k=R.textures;for(let Q=0,N=k.length;Q<N;Q++){const G=i.get(k[Q]);G.__webglTexture&&(n.deleteTexture(G.__webglTexture),o.memory.textures--),i.remove(k[Q])}i.remove(R)}let P=0;function I(){P=0}function F(){const R=P;return R>=a.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+a.maxTextures),P+=1,R}function X(R){const b=[];return b.push(R.wrapS),b.push(R.wrapT),b.push(R.wrapR||0),b.push(R.magFilter),b.push(R.minFilter),b.push(R.anisotropy),b.push(R.internalFormat),b.push(R.format),b.push(R.type),b.push(R.generateMipmaps),b.push(R.premultiplyAlpha),b.push(R.flipY),b.push(R.unpackAlignment),b.push(R.colorSpace),b.join()}function q(R,b){const k=i.get(R);if(R.isVideoTexture&&ce(R),R.isRenderTargetTexture===!1&&R.version>0&&k.__version!==R.version){const Q=R.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{j(k,R,b);return}}t.bindTexture(n.TEXTURE_2D,k.__webglTexture,n.TEXTURE0+b)}function B(R,b){const k=i.get(R);if(R.version>0&&k.__version!==R.version){j(k,R,b);return}t.bindTexture(n.TEXTURE_2D_ARRAY,k.__webglTexture,n.TEXTURE0+b)}function K(R,b){const k=i.get(R);if(R.version>0&&k.__version!==R.version){j(k,R,b);return}t.bindTexture(n.TEXTURE_3D,k.__webglTexture,n.TEXTURE0+b)}function H(R,b){const k=i.get(R);if(R.version>0&&k.__version!==R.version){le(k,R,b);return}t.bindTexture(n.TEXTURE_CUBE_MAP,k.__webglTexture,n.TEXTURE0+b)}const se={[rs]:n.REPEAT,[Ai]:n.CLAMP_TO_EDGE,[os]:n.MIRRORED_REPEAT},ue={[un]:n.NEAREST,[hd]:n.NEAREST_MIPMAP_NEAREST,[Ja]:n.NEAREST_MIPMAP_LINEAR,[En]:n.LINEAR,[ho]:n.LINEAR_MIPMAP_NEAREST,[Ei]:n.LINEAR_MIPMAP_LINEAR},de={[gd]:n.NEVER,[wd]:n.ALWAYS,[xd]:n.LESS,[pu]:n.LEQUAL,[_d]:n.EQUAL,[Sd]:n.GEQUAL,[yd]:n.GREATER,[Md]:n.NOTEQUAL};function _e(R,b){if(b.type===Cn&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===En||b.magFilter===ho||b.magFilter===Ja||b.magFilter===Ei||b.minFilter===En||b.minFilter===ho||b.minFilter===Ja||b.minFilter===Ei)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(R,n.TEXTURE_WRAP_S,se[b.wrapS]),n.texParameteri(R,n.TEXTURE_WRAP_T,se[b.wrapT]),(R===n.TEXTURE_3D||R===n.TEXTURE_2D_ARRAY)&&n.texParameteri(R,n.TEXTURE_WRAP_R,se[b.wrapR]),n.texParameteri(R,n.TEXTURE_MAG_FILTER,ue[b.magFilter]),n.texParameteri(R,n.TEXTURE_MIN_FILTER,ue[b.minFilter]),b.compareFunction&&(n.texParameteri(R,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(R,n.TEXTURE_COMPARE_FUNC,de[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===un||b.minFilter!==Ja&&b.minFilter!==Ei||b.type===Cn&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||i.get(b).__currentAnisotropy){const k=e.get("EXT_texture_filter_anisotropic");n.texParameterf(R,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,a.getMaxAnisotropy())),i.get(b).__currentAnisotropy=b.anisotropy}}}function Re(R,b){let k=!1;R.__webglInit===void 0&&(R.__webglInit=!0,b.addEventListener("dispose",w));const Q=b.source;let N=h.get(Q);N===void 0&&(N={},h.set(Q,N));const G=X(b);if(G!==R.__cacheKey){N[G]===void 0&&(N[G]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,k=!0),N[G].usedTimes++;const te=N[R.__cacheKey];te!==void 0&&(N[R.__cacheKey].usedTimes--,te.usedTimes===0&&y(b)),R.__cacheKey=G,R.__webglTexture=N[G].texture}return k}function j(R,b,k){let Q=n.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(Q=n.TEXTURE_2D_ARRAY),b.isData3DTexture&&(Q=n.TEXTURE_3D);const N=Re(R,b),G=b.source;t.bindTexture(Q,R.__webglTexture,n.TEXTURE0+k);const te=i.get(G);if(G.version!==te.__version||N===!0){t.activeTexture(n.TEXTURE0+k);const O=ht.getPrimaries(ht.workingColorSpace),he=b.colorSpace===oi?null:ht.getPrimaries(b.colorSpace),Ae=b.colorSpace===oi||O===he?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,b.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,b.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ae);let ee=x(b.image,!1,a.maxTextureSize);ee=ge(b,ee);const me=r.convert(b.format,b.colorSpace),Ce=r.convert(b.type);let Ie=S(b.internalFormat,me,Ce,b.colorSpace,b.isVideoTexture);_e(Q,b);let Me;const Ye=b.mipmaps,ne=b.isVideoTexture!==!0,Se=te.__version===void 0||N===!0,L=G.dataReady,ae=T(b,ee);if(b.isDepthTexture)Ie=v(b.format===fa,b.type),Se&&(ne?t.texStorage2D(n.TEXTURE_2D,1,Ie,ee.width,ee.height):t.texImage2D(n.TEXTURE_2D,0,Ie,ee.width,ee.height,0,me,Ce,null));else if(b.isDataTexture)if(Ye.length>0){ne&&Se&&t.texStorage2D(n.TEXTURE_2D,ae,Ie,Ye[0].width,Ye[0].height);for(let V=0,$=Ye.length;V<$;V++)Me=Ye[V],ne?L&&t.texSubImage2D(n.TEXTURE_2D,V,0,0,Me.width,Me.height,me,Ce,Me.data):t.texImage2D(n.TEXTURE_2D,V,Ie,Me.width,Me.height,0,me,Ce,Me.data);b.generateMipmaps=!1}else ne?(Se&&t.texStorage2D(n.TEXTURE_2D,ae,Ie,ee.width,ee.height),L&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ee.width,ee.height,me,Ce,ee.data)):t.texImage2D(n.TEXTURE_2D,0,Ie,ee.width,ee.height,0,me,Ce,ee.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){ne&&Se&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ae,Ie,Ye[0].width,Ye[0].height,ee.depth);for(let V=0,$=Ye.length;V<$;V++)if(Me=Ye[V],b.format!==Sn)if(me!==null)if(ne){if(L)if(b.layerUpdates.size>0){const oe=uc(Me.width,Me.height,b.format,b.type);for(const re of b.layerUpdates){const ye=Me.data.subarray(re*oe/Me.data.BYTES_PER_ELEMENT,(re+1)*oe/Me.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,V,0,0,re,Me.width,Me.height,1,me,ye)}b.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,V,0,0,0,Me.width,Me.height,ee.depth,me,Me.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,V,Ie,Me.width,Me.height,ee.depth,0,Me.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ne?L&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,V,0,0,0,Me.width,Me.height,ee.depth,me,Ce,Me.data):t.texImage3D(n.TEXTURE_2D_ARRAY,V,Ie,Me.width,Me.height,ee.depth,0,me,Ce,Me.data)}else{ne&&Se&&t.texStorage2D(n.TEXTURE_2D,ae,Ie,Ye[0].width,Ye[0].height);for(let V=0,$=Ye.length;V<$;V++)Me=Ye[V],b.format!==Sn?me!==null?ne?L&&t.compressedTexSubImage2D(n.TEXTURE_2D,V,0,0,Me.width,Me.height,me,Me.data):t.compressedTexImage2D(n.TEXTURE_2D,V,Ie,Me.width,Me.height,0,Me.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ne?L&&t.texSubImage2D(n.TEXTURE_2D,V,0,0,Me.width,Me.height,me,Ce,Me.data):t.texImage2D(n.TEXTURE_2D,V,Ie,Me.width,Me.height,0,me,Ce,Me.data)}else if(b.isDataArrayTexture)if(ne){if(Se&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ae,Ie,ee.width,ee.height,ee.depth),L)if(b.layerUpdates.size>0){const V=uc(ee.width,ee.height,b.format,b.type);for(const $ of b.layerUpdates){const oe=ee.data.subarray($*V/ee.data.BYTES_PER_ELEMENT,($+1)*V/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,$,ee.width,ee.height,1,me,Ce,oe)}b.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,me,Ce,ee.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ie,ee.width,ee.height,ee.depth,0,me,Ce,ee.data);else if(b.isData3DTexture)ne?(Se&&t.texStorage3D(n.TEXTURE_3D,ae,Ie,ee.width,ee.height,ee.depth),L&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,me,Ce,ee.data)):t.texImage3D(n.TEXTURE_3D,0,Ie,ee.width,ee.height,ee.depth,0,me,Ce,ee.data);else if(b.isFramebufferTexture){if(Se)if(ne)t.texStorage2D(n.TEXTURE_2D,ae,Ie,ee.width,ee.height);else{let V=ee.width,$=ee.height;for(let oe=0;oe<ae;oe++)t.texImage2D(n.TEXTURE_2D,oe,Ie,V,$,0,me,Ce,null),V>>=1,$>>=1}}else if(Ye.length>0){if(ne&&Se){const V=pe(Ye[0]);t.texStorage2D(n.TEXTURE_2D,ae,Ie,V.width,V.height)}for(let V=0,$=Ye.length;V<$;V++)Me=Ye[V],ne?L&&t.texSubImage2D(n.TEXTURE_2D,V,0,0,me,Ce,Me):t.texImage2D(n.TEXTURE_2D,V,Ie,me,Ce,Me);b.generateMipmaps=!1}else if(ne){if(Se){const V=pe(ee);t.texStorage2D(n.TEXTURE_2D,ae,Ie,V.width,V.height)}L&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,me,Ce,ee)}else t.texImage2D(n.TEXTURE_2D,0,Ie,me,Ce,ee);m(b)&&u(Q),te.__version=G.version,b.onUpdate&&b.onUpdate(b)}R.__version=b.version}function le(R,b,k){if(b.image.length!==6)return;const Q=Re(R,b),N=b.source;t.bindTexture(n.TEXTURE_CUBE_MAP,R.__webglTexture,n.TEXTURE0+k);const G=i.get(N);if(N.version!==G.__version||Q===!0){t.activeTexture(n.TEXTURE0+k);const te=ht.getPrimaries(ht.workingColorSpace),O=b.colorSpace===oi?null:ht.getPrimaries(b.colorSpace),he=b.colorSpace===oi||te===O?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,b.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,b.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,he);const Ae=b.isCompressedTexture||b.image[0].isCompressedTexture,ee=b.image[0]&&b.image[0].isDataTexture,me=[];for(let $=0;$<6;$++)!Ae&&!ee?me[$]=x(b.image[$],!0,a.maxCubemapSize):me[$]=ee?b.image[$].image:b.image[$],me[$]=ge(b,me[$]);const Ce=me[0],Ie=r.convert(b.format,b.colorSpace),Me=r.convert(b.type),Ye=S(b.internalFormat,Ie,Me,b.colorSpace),ne=b.isVideoTexture!==!0,Se=G.__version===void 0||Q===!0,L=N.dataReady;let ae=T(b,Ce);_e(n.TEXTURE_CUBE_MAP,b);let V;if(Ae){ne&&Se&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ae,Ye,Ce.width,Ce.height);for(let $=0;$<6;$++){V=me[$].mipmaps;for(let oe=0;oe<V.length;oe++){const re=V[oe];b.format!==Sn?Ie!==null?ne?L&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,oe,0,0,re.width,re.height,Ie,re.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,oe,Ye,re.width,re.height,0,re.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ne?L&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,oe,0,0,re.width,re.height,Ie,Me,re.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,oe,Ye,re.width,re.height,0,Ie,Me,re.data)}}}else{if(V=b.mipmaps,ne&&Se){V.length>0&&ae++;const $=pe(me[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ae,Ye,$.width,$.height)}for(let $=0;$<6;$++)if(ee){ne?L&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,me[$].width,me[$].height,Ie,Me,me[$].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Ye,me[$].width,me[$].height,0,Ie,Me,me[$].data);for(let oe=0;oe<V.length;oe++){const ye=V[oe].image[$].image;ne?L&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,oe+1,0,0,ye.width,ye.height,Ie,Me,ye.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,oe+1,Ye,ye.width,ye.height,0,Ie,Me,ye.data)}}else{ne?L&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,Ie,Me,me[$]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Ye,Ie,Me,me[$]);for(let oe=0;oe<V.length;oe++){const re=V[oe];ne?L&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,oe+1,0,0,Ie,Me,re.image[$]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,oe+1,Ye,Ie,Me,re.image[$])}}}m(b)&&u(n.TEXTURE_CUBE_MAP),G.__version=N.version,b.onUpdate&&b.onUpdate(b)}R.__version=b.version}function Te(R,b,k,Q,N,G){const te=r.convert(k.format,k.colorSpace),O=r.convert(k.type),he=S(k.internalFormat,te,O,k.colorSpace),Ae=i.get(b),ee=i.get(k);if(ee.__renderTarget=b,!Ae.__hasExternalTextures){const me=Math.max(1,b.width>>G),Ce=Math.max(1,b.height>>G);N===n.TEXTURE_3D||N===n.TEXTURE_2D_ARRAY?t.texImage3D(N,G,he,me,Ce,b.depth,0,te,O,null):t.texImage2D(N,G,he,me,Ce,0,te,O,null)}t.bindFramebuffer(n.FRAMEBUFFER,R),J(b)?s.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Q,N,ee.__webglTexture,0,be(b)):(N===n.TEXTURE_2D||N>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&N<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Q,N,ee.__webglTexture,G),t.bindFramebuffer(n.FRAMEBUFFER,null)}function fe(R,b,k){if(n.bindRenderbuffer(n.RENDERBUFFER,R),b.depthBuffer){const Q=b.depthTexture,N=Q&&Q.isDepthTexture?Q.type:null,G=v(b.stencilBuffer,N),te=b.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,O=be(b);J(b)?s.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,O,G,b.width,b.height):k?n.renderbufferStorageMultisample(n.RENDERBUFFER,O,G,b.width,b.height):n.renderbufferStorage(n.RENDERBUFFER,G,b.width,b.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,te,n.RENDERBUFFER,R)}else{const Q=b.textures;for(let N=0;N<Q.length;N++){const G=Q[N],te=r.convert(G.format,G.colorSpace),O=r.convert(G.type),he=S(G.internalFormat,te,O,G.colorSpace),Ae=be(b);k&&J(b)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ae,he,b.width,b.height):J(b)?s.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ae,he,b.width,b.height):n.renderbufferStorage(n.RENDERBUFFER,he,b.width,b.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function we(R,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,R),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Q=i.get(b.depthTexture);Q.__renderTarget=b,(!Q.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),q(b.depthTexture,0);const N=Q.__webglTexture,G=be(b);if(b.depthTexture.format===oa)J(b)?s.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,N,0,G):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,N,0);else if(b.depthTexture.format===fa)J(b)?s.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,N,0,G):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,N,0);else throw new Error("Unknown depthTexture format")}function ve(R){const b=i.get(R),k=R.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==R.depthTexture){const Q=R.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),Q){const N=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,Q.removeEventListener("dispose",N)};Q.addEventListener("dispose",N),b.__depthDisposeCallback=N}b.__boundDepthTexture=Q}if(R.depthTexture&&!b.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");we(b.__webglFramebuffer,R)}else if(k){b.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)if(t.bindFramebuffer(n.FRAMEBUFFER,b.__webglFramebuffer[Q]),b.__webglDepthbuffer[Q]===void 0)b.__webglDepthbuffer[Q]=n.createRenderbuffer(),fe(b.__webglDepthbuffer[Q],R,!1);else{const N=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,G=b.__webglDepthbuffer[Q];n.bindRenderbuffer(n.RENDERBUFFER,G),n.framebufferRenderbuffer(n.FRAMEBUFFER,N,n.RENDERBUFFER,G)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=n.createRenderbuffer(),fe(b.__webglDepthbuffer,R,!1);else{const Q=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,N=b.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,N),n.framebufferRenderbuffer(n.FRAMEBUFFER,Q,n.RENDERBUFFER,N)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function qe(R,b,k){const Q=i.get(R);b!==void 0&&Te(Q.__webglFramebuffer,R,R.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),k!==void 0&&ve(R)}function Je(R){const b=R.texture,k=i.get(R),Q=i.get(b);R.addEventListener("dispose",E);const N=R.textures,G=R.isWebGLCubeRenderTarget===!0,te=N.length>1;if(te||(Q.__webglTexture===void 0&&(Q.__webglTexture=n.createTexture()),Q.__version=b.version,o.memory.textures++),G){k.__webglFramebuffer=[];for(let O=0;O<6;O++)if(b.mipmaps&&b.mipmaps.length>0){k.__webglFramebuffer[O]=[];for(let he=0;he<b.mipmaps.length;he++)k.__webglFramebuffer[O][he]=n.createFramebuffer()}else k.__webglFramebuffer[O]=n.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){k.__webglFramebuffer=[];for(let O=0;O<b.mipmaps.length;O++)k.__webglFramebuffer[O]=n.createFramebuffer()}else k.__webglFramebuffer=n.createFramebuffer();if(te)for(let O=0,he=N.length;O<he;O++){const Ae=i.get(N[O]);Ae.__webglTexture===void 0&&(Ae.__webglTexture=n.createTexture(),o.memory.textures++)}if(R.samples>0&&J(R)===!1){k.__webglMultisampledFramebuffer=n.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let O=0;O<N.length;O++){const he=N[O];k.__webglColorRenderbuffer[O]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,k.__webglColorRenderbuffer[O]);const Ae=r.convert(he.format,he.colorSpace),ee=r.convert(he.type),me=S(he.internalFormat,Ae,ee,he.colorSpace,R.isXRRenderTarget===!0),Ce=be(R);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ce,me,R.width,R.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+O,n.RENDERBUFFER,k.__webglColorRenderbuffer[O])}n.bindRenderbuffer(n.RENDERBUFFER,null),R.depthBuffer&&(k.__webglDepthRenderbuffer=n.createRenderbuffer(),fe(k.__webglDepthRenderbuffer,R,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(G){t.bindTexture(n.TEXTURE_CUBE_MAP,Q.__webglTexture),_e(n.TEXTURE_CUBE_MAP,b);for(let O=0;O<6;O++)if(b.mipmaps&&b.mipmaps.length>0)for(let he=0;he<b.mipmaps.length;he++)Te(k.__webglFramebuffer[O][he],R,b,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+O,he);else Te(k.__webglFramebuffer[O],R,b,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+O,0);m(b)&&u(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(te){for(let O=0,he=N.length;O<he;O++){const Ae=N[O],ee=i.get(Ae);t.bindTexture(n.TEXTURE_2D,ee.__webglTexture),_e(n.TEXTURE_2D,Ae),Te(k.__webglFramebuffer,R,Ae,n.COLOR_ATTACHMENT0+O,n.TEXTURE_2D,0),m(Ae)&&u(n.TEXTURE_2D)}t.unbindTexture()}else{let O=n.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(O=R.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(O,Q.__webglTexture),_e(O,b),b.mipmaps&&b.mipmaps.length>0)for(let he=0;he<b.mipmaps.length;he++)Te(k.__webglFramebuffer[he],R,b,n.COLOR_ATTACHMENT0,O,he);else Te(k.__webglFramebuffer,R,b,n.COLOR_ATTACHMENT0,O,0);m(b)&&u(O),t.unbindTexture()}R.depthBuffer&&ve(R)}function $e(R){const b=R.textures;for(let k=0,Q=b.length;k<Q;k++){const N=b[k];if(m(N)){const G=M(R),te=i.get(N).__webglTexture;t.bindTexture(G,te),u(G),t.unbindTexture()}}}const Qe=[],z=[];function nt(R){if(R.samples>0){if(J(R)===!1){const b=R.textures,k=R.width,Q=R.height;let N=n.COLOR_BUFFER_BIT;const G=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,te=i.get(R),O=b.length>1;if(O)for(let he=0;he<b.length;he++)t.bindFramebuffer(n.FRAMEBUFFER,te.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+he,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,te.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+he,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,te.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,te.__webglFramebuffer);for(let he=0;he<b.length;he++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(N|=n.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(N|=n.STENCIL_BUFFER_BIT)),O){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,te.__webglColorRenderbuffer[he]);const Ae=i.get(b[he]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Ae,0)}n.blitFramebuffer(0,0,k,Q,0,0,k,Q,N,n.NEAREST),l===!0&&(Qe.length=0,z.length=0,Qe.push(n.COLOR_ATTACHMENT0+he),R.depthBuffer&&R.resolveDepthBuffer===!1&&(Qe.push(G),z.push(G),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,z)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Qe))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),O)for(let he=0;he<b.length;he++){t.bindFramebuffer(n.FRAMEBUFFER,te.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+he,n.RENDERBUFFER,te.__webglColorRenderbuffer[he]);const Ae=i.get(b[he]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,te.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+he,n.TEXTURE_2D,Ae,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,te.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){const b=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[b])}}}function be(R){return Math.min(a.maxSamples,R.samples)}function J(R){const b=i.get(R);return R.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function ce(R){const b=o.render.frame;f.get(R)!==b&&(f.set(R,b),R.update())}function ge(R,b){const k=R.colorSpace,Q=R.format,N=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||k!==ga&&k!==oi&&(ht.getTransfer(k)===St?(Q!==Sn||N!==qn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),b}function pe(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=F,this.resetTextureUnits=I,this.setTexture2D=q,this.setTexture2DArray=B,this.setTexture3D=K,this.setTextureCube=H,this.rebindTextures=qe,this.setupRenderTarget=Je,this.updateRenderTargetMipmap=$e,this.updateMultisampleRenderTarget=nt,this.setupDepthRenderbuffer=ve,this.setupFrameBufferTexture=Te,this.useMultisampledRTT=J}function Pm(n,e){function t(i,a=oi){let r;const o=ht.getTransfer(a);if(i===qn)return n.UNSIGNED_BYTE;if(i===Gs)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Hs)return n.UNSIGNED_SHORT_5_5_5_1;if(i===su)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===ru)return n.BYTE;if(i===ou)return n.SHORT;if(i===Ha)return n.UNSIGNED_SHORT;if(i===Ws)return n.INT;if(i===Ri)return n.UNSIGNED_INT;if(i===Cn)return n.FLOAT;if(i===Pn)return n.HALF_FLOAT;if(i===lu)return n.ALPHA;if(i===cu)return n.RGB;if(i===Sn)return n.RGBA;if(i===uu)return n.LUMINANCE;if(i===du)return n.LUMINANCE_ALPHA;if(i===oa)return n.DEPTH_COMPONENT;if(i===fa)return n.DEPTH_STENCIL;if(i===Xs)return n.RED;if(i===qs)return n.RED_INTEGER;if(i===hu)return n.RG;if(i===Ys)return n.RG_INTEGER;if(i===Zs)return n.RGBA_INTEGER;if(i===Ur||i===zr||i===Or||i===Br)if(o===St)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===Ur)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===zr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Or)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Br)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===Ur)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===zr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Or)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Br)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===ss||i===ls||i===cs||i===us)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===ss)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ls)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===cs)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===us)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===ds||i===hs||i===fs)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===ds||i===hs)return o===St?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===fs)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===ps||i===ms||i===vs||i===gs||i===xs||i===_s||i===ys||i===Ms||i===Ss||i===ws||i===bs||i===Ts||i===As||i===Es)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===ps)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===ms)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===vs)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===gs)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===xs)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===_s)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===ys)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Ms)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Ss)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ws)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===bs)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Ts)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===As)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Es)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===kr||i===Cs||i===Ps)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===kr)return o===St?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Cs)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Ps)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===fu||i===Rs||i===Ds||i===Ls)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===kr)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Rs)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ds)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Ls)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ha?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}class Rm extends Qt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class _r extends Nt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Dm={type:"move"};class ko{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new _r,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new _r,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new _r,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let a=null,r=null,o=null;const s=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const x of e.hand.values()){const m=t.getJointPose(x,i),u=this._getHandJoint(c,x);m!==null&&(u.matrix.fromArray(m.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=m.radius),u.visible=m!==null}const f=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=f.position.distanceTo(d.position),p=.02,g=.005;c.inputState.pinching&&h>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));s!==null&&(a=t.getPose(e.targetRaySpace,i),a===null&&r!==null&&(a=r),a!==null&&(s.matrix.fromArray(a.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,a.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(a.linearVelocity)):s.hasLinearVelocity=!1,a.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(a.angularVelocity)):s.hasAngularVelocity=!1,this.dispatchEvent(Dm)))}return s!==null&&(s.visible=a!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new _r;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const Lm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Nm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Fm{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){const a=new jt,r=e.properties.get(a);r.__webglTexture=t.texture,(t.depthNear!=i.depthNear||t.depthFar!=i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=a}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new Ke({vertexShader:Lm,fragmentShader:Nm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ut(new en(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Im extends Li{constructor(e,t){super();const i=this;let a=null,r=1,o=null,s="local-floor",l=1,c=null,f=null,d=null,h=null,p=null,g=null;const x=new Fm,m=t.getContextAttributes();let u=null,M=null;const S=[],v=[],T=new Le;let w=null;const E=new Qt;E.viewport=new wt;const C=new Qt;C.viewport=new wt;const y=[E,C],_=new Rm;let P=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let le=S[j];return le===void 0&&(le=new ko,S[j]=le),le.getTargetRaySpace()},this.getControllerGrip=function(j){let le=S[j];return le===void 0&&(le=new ko,S[j]=le),le.getGripSpace()},this.getHand=function(j){let le=S[j];return le===void 0&&(le=new ko,S[j]=le),le.getHandSpace()};function F(j){const le=v.indexOf(j.inputSource);if(le===-1)return;const Te=S[le];Te!==void 0&&(Te.update(j.inputSource,j.frame,c||o),Te.dispatchEvent({type:j.type,data:j.inputSource}))}function X(){a.removeEventListener("select",F),a.removeEventListener("selectstart",F),a.removeEventListener("selectend",F),a.removeEventListener("squeeze",F),a.removeEventListener("squeezestart",F),a.removeEventListener("squeezeend",F),a.removeEventListener("end",X),a.removeEventListener("inputsourceschange",q);for(let j=0;j<S.length;j++){const le=v[j];le!==null&&(v[j]=null,S[j].disconnect(le))}P=null,I=null,x.reset(),e.setRenderTarget(u),p=null,h=null,d=null,a=null,M=null,Re.stop(),i.isPresenting=!1,e.setPixelRatio(w),e.setSize(T.width,T.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){r=j,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){s=j,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return a},this.setSession=async function(j){if(a=j,a!==null){if(u=e.getRenderTarget(),a.addEventListener("select",F),a.addEventListener("selectstart",F),a.addEventListener("selectend",F),a.addEventListener("squeeze",F),a.addEventListener("squeezestart",F),a.addEventListener("squeezeend",F),a.addEventListener("end",X),a.addEventListener("inputsourceschange",q),m.xrCompatible!==!0&&await t.makeXRCompatible(),w=e.getPixelRatio(),e.getSize(T),a.renderState.layers===void 0){const le={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(a,t,le),a.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),M=new vn(p.framebufferWidth,p.framebufferHeight,{format:Sn,type:qn,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil})}else{let le=null,Te=null,fe=null;m.depth&&(fe=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,le=m.stencil?fa:oa,Te=m.stencil?ha:Ri);const we={colorFormat:t.RGBA8,depthFormat:fe,scaleFactor:r};d=new XRWebGLBinding(a,t),h=d.createProjectionLayer(we),a.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),M=new vn(h.textureWidth,h.textureHeight,{format:Sn,type:qn,depthTexture:new Tu(h.textureWidth,h.textureHeight,Te,void 0,void 0,void 0,void 0,void 0,void 0,le),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await a.requestReferenceSpace(s),Re.setContext(a),Re.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(a!==null)return a.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function q(j){for(let le=0;le<j.removed.length;le++){const Te=j.removed[le],fe=v.indexOf(Te);fe>=0&&(v[fe]=null,S[fe].disconnect(Te))}for(let le=0;le<j.added.length;le++){const Te=j.added[le];let fe=v.indexOf(Te);if(fe===-1){for(let ve=0;ve<S.length;ve++)if(ve>=v.length){v.push(Te),fe=ve;break}else if(v[ve]===null){v[ve]=Te,fe=ve;break}if(fe===-1)break}const we=S[fe];we&&we.connect(Te)}}const B=new D,K=new D;function H(j,le,Te){B.setFromMatrixPosition(le.matrixWorld),K.setFromMatrixPosition(Te.matrixWorld);const fe=B.distanceTo(K),we=le.projectionMatrix.elements,ve=Te.projectionMatrix.elements,qe=we[14]/(we[10]-1),Je=we[14]/(we[10]+1),$e=(we[9]+1)/we[5],Qe=(we[9]-1)/we[5],z=(we[8]-1)/we[0],nt=(ve[8]+1)/ve[0],be=qe*z,J=qe*nt,ce=fe/(-z+nt),ge=ce*-z;if(le.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(ge),j.translateZ(ce),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),we[10]===-1)j.projectionMatrix.copy(le.projectionMatrix),j.projectionMatrixInverse.copy(le.projectionMatrixInverse);else{const pe=qe+ce,R=Je+ce,b=be-ge,k=J+(fe-ge),Q=$e*Je/R*pe,N=Qe*Je/R*pe;j.projectionMatrix.makePerspective(b,k,Q,N,pe,R),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function se(j,le){le===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(le.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(a===null)return;let le=j.near,Te=j.far;x.texture!==null&&(x.depthNear>0&&(le=x.depthNear),x.depthFar>0&&(Te=x.depthFar)),_.near=C.near=E.near=le,_.far=C.far=E.far=Te,(P!==_.near||I!==_.far)&&(a.updateRenderState({depthNear:_.near,depthFar:_.far}),P=_.near,I=_.far),E.layers.mask=j.layers.mask|2,C.layers.mask=j.layers.mask|4,_.layers.mask=E.layers.mask|C.layers.mask;const fe=j.parent,we=_.cameras;se(_,fe);for(let ve=0;ve<we.length;ve++)se(we[ve],fe);we.length===2?H(_,E,C):_.projectionMatrix.copy(E.projectionMatrix),ue(j,_,fe)};function ue(j,le,Te){Te===null?j.matrix.copy(le.matrixWorld):(j.matrix.copy(Te.matrixWorld),j.matrix.invert(),j.matrix.multiply(le.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(le.projectionMatrix),j.projectionMatrixInverse.copy(le.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Ns*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(h===null&&p===null))return l},this.setFoveation=function(j){l=j,h!==null&&(h.fixedFoveation=j),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=j)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(_)};let de=null;function _e(j,le){if(f=le.getViewerPose(c||o),g=le,f!==null){const Te=f.views;p!==null&&(e.setRenderTargetFramebuffer(M,p.framebuffer),e.setRenderTarget(M));let fe=!1;Te.length!==_.cameras.length&&(_.cameras.length=0,fe=!0);for(let ve=0;ve<Te.length;ve++){const qe=Te[ve];let Je=null;if(p!==null)Je=p.getViewport(qe);else{const Qe=d.getViewSubImage(h,qe);Je=Qe.viewport,ve===0&&(e.setRenderTargetTextures(M,Qe.colorTexture,h.ignoreDepthValues?void 0:Qe.depthStencilTexture),e.setRenderTarget(M))}let $e=y[ve];$e===void 0&&($e=new Qt,$e.layers.enable(ve),$e.viewport=new wt,y[ve]=$e),$e.matrix.fromArray(qe.transform.matrix),$e.matrix.decompose($e.position,$e.quaternion,$e.scale),$e.projectionMatrix.fromArray(qe.projectionMatrix),$e.projectionMatrixInverse.copy($e.projectionMatrix).invert(),$e.viewport.set(Je.x,Je.y,Je.width,Je.height),ve===0&&(_.matrix.copy($e.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),fe===!0&&_.cameras.push($e)}const we=a.enabledFeatures;if(we&&we.includes("depth-sensing")){const ve=d.getDepthInformation(Te[0]);ve&&ve.isValid&&ve.texture&&x.init(e,ve,a.renderState)}}for(let Te=0;Te<S.length;Te++){const fe=v[Te],we=S[Te];fe!==null&&we!==void 0&&we.update(fe,le,c||o)}de&&de(j,le),le.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:le}),g=null}const Re=new bu;Re.setAnimationLoop(_e),this.setAnimationLoop=function(j){de=j},this.dispose=function(){}}}const _i=new Zn,Um=new yt;function zm(n,e){function t(m,u){m.matrixAutoUpdate===!0&&m.updateMatrix(),u.value.copy(m.matrix)}function i(m,u){u.color.getRGB(m.fogColor.value,Mu(n)),u.isFog?(m.fogNear.value=u.near,m.fogFar.value=u.far):u.isFogExp2&&(m.fogDensity.value=u.density)}function a(m,u,M,S,v){u.isMeshBasicMaterial||u.isMeshLambertMaterial?r(m,u):u.isMeshToonMaterial?(r(m,u),d(m,u)):u.isMeshPhongMaterial?(r(m,u),f(m,u)):u.isMeshStandardMaterial?(r(m,u),h(m,u),u.isMeshPhysicalMaterial&&p(m,u,v)):u.isMeshMatcapMaterial?(r(m,u),g(m,u)):u.isMeshDepthMaterial?r(m,u):u.isMeshDistanceMaterial?(r(m,u),x(m,u)):u.isMeshNormalMaterial?r(m,u):u.isLineBasicMaterial?(o(m,u),u.isLineDashedMaterial&&s(m,u)):u.isPointsMaterial?l(m,u,M,S):u.isSpriteMaterial?c(m,u):u.isShadowMaterial?(m.color.value.copy(u.color),m.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function r(m,u){m.opacity.value=u.opacity,u.color&&m.diffuse.value.copy(u.color),u.emissive&&m.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(m.map.value=u.map,t(u.map,m.mapTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,t(u.alphaMap,m.alphaMapTransform)),u.bumpMap&&(m.bumpMap.value=u.bumpMap,t(u.bumpMap,m.bumpMapTransform),m.bumpScale.value=u.bumpScale,u.side===Lt&&(m.bumpScale.value*=-1)),u.normalMap&&(m.normalMap.value=u.normalMap,t(u.normalMap,m.normalMapTransform),m.normalScale.value.copy(u.normalScale),u.side===Lt&&m.normalScale.value.negate()),u.displacementMap&&(m.displacementMap.value=u.displacementMap,t(u.displacementMap,m.displacementMapTransform),m.displacementScale.value=u.displacementScale,m.displacementBias.value=u.displacementBias),u.emissiveMap&&(m.emissiveMap.value=u.emissiveMap,t(u.emissiveMap,m.emissiveMapTransform)),u.specularMap&&(m.specularMap.value=u.specularMap,t(u.specularMap,m.specularMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest);const M=e.get(u),S=M.envMap,v=M.envMapRotation;S&&(m.envMap.value=S,_i.copy(v),_i.x*=-1,_i.y*=-1,_i.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(_i.y*=-1,_i.z*=-1),m.envMapRotation.value.setFromMatrix4(Um.makeRotationFromEuler(_i)),m.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=u.reflectivity,m.ior.value=u.ior,m.refractionRatio.value=u.refractionRatio),u.lightMap&&(m.lightMap.value=u.lightMap,m.lightMapIntensity.value=u.lightMapIntensity,t(u.lightMap,m.lightMapTransform)),u.aoMap&&(m.aoMap.value=u.aoMap,m.aoMapIntensity.value=u.aoMapIntensity,t(u.aoMap,m.aoMapTransform))}function o(m,u){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,u.map&&(m.map.value=u.map,t(u.map,m.mapTransform))}function s(m,u){m.dashSize.value=u.dashSize,m.totalSize.value=u.dashSize+u.gapSize,m.scale.value=u.scale}function l(m,u,M,S){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,m.size.value=u.size*M,m.scale.value=S*.5,u.map&&(m.map.value=u.map,t(u.map,m.uvTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,t(u.alphaMap,m.alphaMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest)}function c(m,u){m.diffuse.value.copy(u.color),m.opacity.value=u.opacity,m.rotation.value=u.rotation,u.map&&(m.map.value=u.map,t(u.map,m.mapTransform)),u.alphaMap&&(m.alphaMap.value=u.alphaMap,t(u.alphaMap,m.alphaMapTransform)),u.alphaTest>0&&(m.alphaTest.value=u.alphaTest)}function f(m,u){m.specular.value.copy(u.specular),m.shininess.value=Math.max(u.shininess,1e-4)}function d(m,u){u.gradientMap&&(m.gradientMap.value=u.gradientMap)}function h(m,u){m.metalness.value=u.metalness,u.metalnessMap&&(m.metalnessMap.value=u.metalnessMap,t(u.metalnessMap,m.metalnessMapTransform)),m.roughness.value=u.roughness,u.roughnessMap&&(m.roughnessMap.value=u.roughnessMap,t(u.roughnessMap,m.roughnessMapTransform)),u.envMap&&(m.envMapIntensity.value=u.envMapIntensity)}function p(m,u,M){m.ior.value=u.ior,u.sheen>0&&(m.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),m.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(m.sheenColorMap.value=u.sheenColorMap,t(u.sheenColorMap,m.sheenColorMapTransform)),u.sheenRoughnessMap&&(m.sheenRoughnessMap.value=u.sheenRoughnessMap,t(u.sheenRoughnessMap,m.sheenRoughnessMapTransform))),u.clearcoat>0&&(m.clearcoat.value=u.clearcoat,m.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(m.clearcoatMap.value=u.clearcoatMap,t(u.clearcoatMap,m.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,t(u.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(m.clearcoatNormalMap.value=u.clearcoatNormalMap,t(u.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===Lt&&m.clearcoatNormalScale.value.negate())),u.dispersion>0&&(m.dispersion.value=u.dispersion),u.iridescence>0&&(m.iridescence.value=u.iridescence,m.iridescenceIOR.value=u.iridescenceIOR,m.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(m.iridescenceMap.value=u.iridescenceMap,t(u.iridescenceMap,m.iridescenceMapTransform)),u.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=u.iridescenceThicknessMap,t(u.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),u.transmission>0&&(m.transmission.value=u.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),u.transmissionMap&&(m.transmissionMap.value=u.transmissionMap,t(u.transmissionMap,m.transmissionMapTransform)),m.thickness.value=u.thickness,u.thicknessMap&&(m.thicknessMap.value=u.thicknessMap,t(u.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=u.attenuationDistance,m.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(m.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(m.anisotropyMap.value=u.anisotropyMap,t(u.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=u.specularIntensity,m.specularColor.value.copy(u.specularColor),u.specularColorMap&&(m.specularColorMap.value=u.specularColorMap,t(u.specularColorMap,m.specularColorMapTransform)),u.specularIntensityMap&&(m.specularIntensityMap.value=u.specularIntensityMap,t(u.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,u){u.matcap&&(m.matcap.value=u.matcap)}function x(m,u){const M=e.get(u).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:a}}function Om(n,e,t,i){let a={},r={},o=[];const s=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,S){const v=S.program;i.uniformBlockBinding(M,v)}function c(M,S){let v=a[M.id];v===void 0&&(g(M),v=f(M),a[M.id]=v,M.addEventListener("dispose",m));const T=S.program;i.updateUBOMapping(M,T);const w=e.render.frame;r[M.id]!==w&&(h(M),r[M.id]=w)}function f(M){const S=d();M.__bindingPointIndex=S;const v=n.createBuffer(),T=M.__size,w=M.usage;return n.bindBuffer(n.UNIFORM_BUFFER,v),n.bufferData(n.UNIFORM_BUFFER,T,w),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,S,v),v}function d(){for(let M=0;M<s;M++)if(o.indexOf(M)===-1)return o.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(M){const S=a[M.id],v=M.uniforms,T=M.__cache;n.bindBuffer(n.UNIFORM_BUFFER,S);for(let w=0,E=v.length;w<E;w++){const C=Array.isArray(v[w])?v[w]:[v[w]];for(let y=0,_=C.length;y<_;y++){const P=C[y];if(p(P,w,y,T)===!0){const I=P.__offset,F=Array.isArray(P.value)?P.value:[P.value];let X=0;for(let q=0;q<F.length;q++){const B=F[q],K=x(B);typeof B=="number"||typeof B=="boolean"?(P.__data[0]=B,n.bufferSubData(n.UNIFORM_BUFFER,I+X,P.__data)):B.isMatrix3?(P.__data[0]=B.elements[0],P.__data[1]=B.elements[1],P.__data[2]=B.elements[2],P.__data[3]=0,P.__data[4]=B.elements[3],P.__data[5]=B.elements[4],P.__data[6]=B.elements[5],P.__data[7]=0,P.__data[8]=B.elements[6],P.__data[9]=B.elements[7],P.__data[10]=B.elements[8],P.__data[11]=0):(B.toArray(P.__data,X),X+=K.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,I,P.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(M,S,v,T){const w=M.value,E=S+"_"+v;if(T[E]===void 0)return typeof w=="number"||typeof w=="boolean"?T[E]=w:T[E]=w.clone(),!0;{const C=T[E];if(typeof w=="number"||typeof w=="boolean"){if(C!==w)return T[E]=w,!0}else if(C.equals(w)===!1)return C.copy(w),!0}return!1}function g(M){const S=M.uniforms;let v=0;const T=16;for(let E=0,C=S.length;E<C;E++){const y=Array.isArray(S[E])?S[E]:[S[E]];for(let _=0,P=y.length;_<P;_++){const I=y[_],F=Array.isArray(I.value)?I.value:[I.value];for(let X=0,q=F.length;X<q;X++){const B=F[X],K=x(B),H=v%T,se=H%K.boundary,ue=H+se;v+=se,ue!==0&&T-ue<K.storage&&(v+=T-ue),I.__data=new Float32Array(K.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=v,v+=K.storage}}}const w=v%T;return w>0&&(v+=T-w),M.__size=v,M.__cache={},this}function x(M){const S={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(S.boundary=4,S.storage=4):M.isVector2?(S.boundary=8,S.storage=8):M.isVector3||M.isColor?(S.boundary=16,S.storage=12):M.isVector4?(S.boundary=16,S.storage=16):M.isMatrix3?(S.boundary=48,S.storage=48):M.isMatrix4?(S.boundary=64,S.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),S}function m(M){const S=M.target;S.removeEventListener("dispose",m);const v=o.indexOf(S.__bindingPointIndex);o.splice(v,1),n.deleteBuffer(a[S.id]),delete a[S.id],delete r[S.id]}function u(){for(const M in a)n.deleteBuffer(a[M]);o=[],a={},r={}}return{bind:l,update:c,dispose:u}}class Bm{constructor(e={}){const{canvas:t=Ed(),context:i=null,depth:a=!0,stencil:r=!1,alpha:o=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;const g=new Uint32Array(4),x=new Int32Array(4);let m=null,u=null;const M=[],S=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=cn,this.toneMapping=hi,this.toneMappingExposure=1;const v=this;let T=!1,w=0,E=0,C=null,y=-1,_=null;const P=new wt,I=new wt;let F=null;const X=new lt(0);let q=0,B=t.width,K=t.height,H=1,se=null,ue=null;const de=new wt(0,0,B,K),_e=new wt(0,0,B,K);let Re=!1;const j=new Ks;let le=!1,Te=!1;const fe=new yt,we=new yt,ve=new D,qe=new wt,Je={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let $e=!1;function Qe(){return C===null?H:1}let z=i;function nt(A,U){return t.getContext(A,U)}try{const A={alpha:!0,depth:a,stencil:r,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:f,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${ks}`),t.addEventListener("webglcontextlost",$,!1),t.addEventListener("webglcontextrestored",oe,!1),t.addEventListener("webglcontextcreationerror",re,!1),z===null){const U="webgl2";if(z=nt(U,A),z===null)throw nt(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(A){throw console.error("THREE.WebGLRenderer: "+A.message),A}let be,J,ce,ge,pe,R,b,k,Q,N,G,te,O,he,Ae,ee,me,Ce,Ie,Me,Ye,ne,Se,L;function ae(){be=new H0(z),be.init(),ne=new Pm(z,be),J=new O0(z,be,e,ne),ce=new Am(z,be),J.reverseDepthBuffer&&h&&ce.buffers.depth.setReversed(!0),ge=new Y0(z),pe=new dm,R=new Cm(z,be,ce,pe,J,ne,ge),b=new k0(v),k=new G0(v),Q=new Qd(z),Se=new U0(z,Q),N=new X0(z,Q,ge,Se),G=new j0(z,N,Q,ge),Ie=new Z0(z,J,R),ee=new B0(pe),te=new um(v,b,k,be,J,Se,ee),O=new zm(v,pe),he=new fm,Ae=new _m(be),Ce=new I0(v,b,k,ce,G,p,l),me=new bm(v,G,J),L=new Om(z,ge,J,ce),Me=new z0(z,be,ge),Ye=new q0(z,be,ge),ge.programs=te.programs,v.capabilities=J,v.extensions=be,v.properties=pe,v.renderLists=he,v.shadowMap=me,v.state=ce,v.info=ge}ae();const V=new Im(v,z);this.xr=V,this.getContext=function(){return z},this.getContextAttributes=function(){return z.getContextAttributes()},this.forceContextLoss=function(){const A=be.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=be.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(A){A!==void 0&&(H=A,this.setSize(B,K,!1))},this.getSize=function(A){return A.set(B,K)},this.setSize=function(A,U,Y=!0){if(V.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}B=A,K=U,t.width=Math.floor(A*H),t.height=Math.floor(U*H),Y===!0&&(t.style.width=A+"px",t.style.height=U+"px"),this.setViewport(0,0,A,U)},this.getDrawingBufferSize=function(A){return A.set(B*H,K*H).floor()},this.setDrawingBufferSize=function(A,U,Y){B=A,K=U,H=Y,t.width=Math.floor(A*Y),t.height=Math.floor(U*Y),this.setViewport(0,0,A,U)},this.getCurrentViewport=function(A){return A.copy(P)},this.getViewport=function(A){return A.copy(de)},this.setViewport=function(A,U,Y,Z){A.isVector4?de.set(A.x,A.y,A.z,A.w):de.set(A,U,Y,Z),ce.viewport(P.copy(de).multiplyScalar(H).round())},this.getScissor=function(A){return A.copy(_e)},this.setScissor=function(A,U,Y,Z){A.isVector4?_e.set(A.x,A.y,A.z,A.w):_e.set(A,U,Y,Z),ce.scissor(I.copy(_e).multiplyScalar(H).round())},this.getScissorTest=function(){return Re},this.setScissorTest=function(A){ce.setScissorTest(Re=A)},this.setOpaqueSort=function(A){se=A},this.setTransparentSort=function(A){ue=A},this.getClearColor=function(A){return A.copy(Ce.getClearColor())},this.setClearColor=function(){Ce.setClearColor.apply(Ce,arguments)},this.getClearAlpha=function(){return Ce.getClearAlpha()},this.setClearAlpha=function(){Ce.setClearAlpha.apply(Ce,arguments)},this.clear=function(A=!0,U=!0,Y=!0){let Z=0;if(A){let W=!1;if(C!==null){const xe=C.texture.format;W=xe===Zs||xe===Ys||xe===qs}if(W){const xe=C.texture.type,Fe=xe===qn||xe===Ri||xe===Ha||xe===ha||xe===Gs||xe===Hs,Be=Ce.getClearColor(),ke=Ce.getClearAlpha(),tt=Be.r,it=Be.g,Ve=Be.b;Fe?(g[0]=tt,g[1]=it,g[2]=Ve,g[3]=ke,z.clearBufferuiv(z.COLOR,0,g)):(x[0]=tt,x[1]=it,x[2]=Ve,x[3]=ke,z.clearBufferiv(z.COLOR,0,x))}else Z|=z.COLOR_BUFFER_BIT}U&&(Z|=z.DEPTH_BUFFER_BIT),Y&&(Z|=z.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z.clear(Z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",$,!1),t.removeEventListener("webglcontextrestored",oe,!1),t.removeEventListener("webglcontextcreationerror",re,!1),he.dispose(),Ae.dispose(),pe.dispose(),b.dispose(),k.dispose(),G.dispose(),Se.dispose(),L.dispose(),te.dispose(),V.dispose(),V.removeEventListener("sessionstart",rt),V.removeEventListener("sessionend",dt),Ue.stop()};function $(A){A.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),T=!0}function oe(){console.log("THREE.WebGLRenderer: Context Restored."),T=!1;const A=ge.autoReset,U=me.enabled,Y=me.autoUpdate,Z=me.needsUpdate,W=me.type;ae(),ge.autoReset=A,me.enabled=U,me.autoUpdate=Y,me.needsUpdate=Z,me.type=W}function re(A){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function ye(A){const U=A.target;U.removeEventListener("dispose",ye),We(U)}function We(A){Ne(A),pe.remove(A)}function Ne(A){const U=pe.get(A).programs;U!==void 0&&(U.forEach(function(Y){te.releaseProgram(Y)}),A.isShaderMaterial&&te.releaseShaderCache(A))}this.renderBufferDirect=function(A,U,Y,Z,W,xe){U===null&&(U=Je);const Fe=W.isMesh&&W.matrixWorld.determinant()<0,Be=Pt(A,U,Y,Z,W);ce.setMaterial(Z,Fe);let ke=Y.index,tt=1;if(Z.wireframe===!0){if(ke=N.getWireframeAttribute(Y),ke===void 0)return;tt=2}const it=Y.drawRange,Ve=Y.attributes.position;let mt=it.start*tt,Tt=(it.start+it.count)*tt;xe!==null&&(mt=Math.max(mt,xe.start*tt),Tt=Math.min(Tt,(xe.start+xe.count)*tt)),ke!==null?(mt=Math.max(mt,0),Tt=Math.min(Tt,ke.count)):Ve!=null&&(mt=Math.max(mt,0),Tt=Math.min(Tt,Ve.count));const Et=Tt-mt;if(Et<0||Et===1/0)return;Se.setup(W,Z,Be,Y,ke);let $t,xt=Me;if(ke!==null&&($t=Q.get(ke),xt=Ye,xt.setIndex($t)),W.isMesh)Z.wireframe===!0?(ce.setLineWidth(Z.wireframeLinewidth*Qe()),xt.setMode(z.LINES)):xt.setMode(z.TRIANGLES);else if(W.isLine){let Xe=Z.linewidth;Xe===void 0&&(Xe=1),ce.setLineWidth(Xe*Qe()),W.isLineSegments?xt.setMode(z.LINES):W.isLineLoop?xt.setMode(z.LINE_LOOP):xt.setMode(z.LINE_STRIP)}else W.isPoints?xt.setMode(z.POINTS):W.isSprite&&xt.setMode(z.TRIANGLES);if(W.isBatchedMesh)if(W._multiDrawInstances!==null)xt.renderMultiDrawInstances(W._multiDrawStarts,W._multiDrawCounts,W._multiDrawCount,W._multiDrawInstances);else if(be.get("WEBGL_multi_draw"))xt.renderMultiDraw(W._multiDrawStarts,W._multiDrawCounts,W._multiDrawCount);else{const Xe=W._multiDrawStarts,Rn=W._multiDrawCounts,_t=W._multiDrawCount,gn=ke?Q.get(ke).bytesPerElement:1,Fi=pe.get(Z).currentProgram.getUniforms();for(let tn=0;tn<_t;tn++)Fi.setValue(z,"_gl_DrawID",tn),xt.render(Xe[tn]/gn,Rn[tn])}else if(W.isInstancedMesh)xt.renderInstances(mt,Et,W.count);else if(Y.isInstancedBufferGeometry){const Xe=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,Rn=Math.min(Y.instanceCount,Xe);xt.renderInstances(mt,Et,Rn)}else xt.render(mt,Et)};function Ee(A,U,Y){A.transparent===!0&&A.side===Bt&&A.forceSinglePass===!1?(A.side=Lt,A.needsUpdate=!0,et(A,U,Y),A.side=Xn,A.needsUpdate=!0,et(A,U,Y),A.side=Bt):et(A,U,Y)}this.compile=function(A,U,Y=null){Y===null&&(Y=A),u=Ae.get(Y),u.init(U),S.push(u),Y.traverseVisible(function(W){W.isLight&&W.layers.test(U.layers)&&(u.pushLight(W),W.castShadow&&u.pushShadow(W))}),A!==Y&&A.traverseVisible(function(W){W.isLight&&W.layers.test(U.layers)&&(u.pushLight(W),W.castShadow&&u.pushShadow(W))}),u.setupLights();const Z=new Set;return A.traverse(function(W){if(!(W.isMesh||W.isPoints||W.isLine||W.isSprite))return;const xe=W.material;if(xe)if(Array.isArray(xe))for(let Fe=0;Fe<xe.length;Fe++){const Be=xe[Fe];Ee(Be,Y,W),Z.add(Be)}else Ee(xe,Y,W),Z.add(xe)}),S.pop(),u=null,Z},this.compileAsync=function(A,U,Y=null){const Z=this.compile(A,U,Y);return new Promise(W=>{function xe(){if(Z.forEach(function(Fe){pe.get(Fe).currentProgram.isReady()&&Z.delete(Fe)}),Z.size===0){W(A);return}setTimeout(xe,10)}be.get("KHR_parallel_shader_compile")!==null?xe():setTimeout(xe,10)})};let Ge=null;function Ze(A){Ge&&Ge(A)}function rt(){Ue.stop()}function dt(){Ue.start()}const Ue=new bu;Ue.setAnimationLoop(Ze),typeof self<"u"&&Ue.setContext(self),this.setAnimationLoop=function(A){Ge=A,V.setAnimationLoop(A),A===null?Ue.stop():Ue.start()},V.addEventListener("sessionstart",rt),V.addEventListener("sessionend",dt),this.render=function(A,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),V.enabled===!0&&V.isPresenting===!0&&(V.cameraAutoUpdate===!0&&V.updateCamera(U),U=V.getCamera()),A.isScene===!0&&A.onBeforeRender(v,A,U,C),u=Ae.get(A,S.length),u.init(U),S.push(u),we.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),j.setFromProjectionMatrix(we),Te=this.localClippingEnabled,le=ee.init(this.clippingPlanes,Te),m=he.get(A,M.length),m.init(),M.push(m),V.enabled===!0&&V.isPresenting===!0){const xe=v.xr.getDepthSensingMesh();xe!==null&&ft(xe,U,-1/0,v.sortObjects)}ft(A,U,0,v.sortObjects),m.finish(),v.sortObjects===!0&&m.sort(se,ue),$e=V.enabled===!1||V.isPresenting===!1||V.hasDepthSensing()===!1,$e&&Ce.addToRenderList(m,A),this.info.render.frame++,le===!0&&ee.beginShadows();const Y=u.state.shadowsArray;me.render(Y,A,U),le===!0&&ee.endShadows(),this.info.autoReset===!0&&this.info.reset();const Z=m.opaque,W=m.transmissive;if(u.setupLights(),U.isArrayCamera){const xe=U.cameras;if(W.length>0)for(let Fe=0,Be=xe.length;Fe<Be;Fe++){const ke=xe[Fe];He(Z,W,A,ke)}$e&&Ce.render(A);for(let Fe=0,Be=xe.length;Fe<Be;Fe++){const ke=xe[Fe];ie(m,A,ke,ke.viewport)}}else W.length>0&&He(Z,W,A,U),$e&&Ce.render(A),ie(m,A,U);C!==null&&(R.updateMultisampleRenderTarget(C),R.updateRenderTargetMipmap(C)),A.isScene===!0&&A.onAfterRender(v,A,U),Se.resetDefaultState(),y=-1,_=null,S.pop(),S.length>0?(u=S[S.length-1],le===!0&&ee.setGlobalState(v.clippingPlanes,u.state.camera)):u=null,M.pop(),M.length>0?m=M[M.length-1]:m=null};function ft(A,U,Y,Z){if(A.visible===!1)return;if(A.layers.test(U.layers)){if(A.isGroup)Y=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(U);else if(A.isLight)u.pushLight(A),A.castShadow&&u.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||j.intersectsSprite(A)){Z&&qe.setFromMatrixPosition(A.matrixWorld).applyMatrix4(we);const Fe=G.update(A),Be=A.material;Be.visible&&m.push(A,Fe,Be,Y,qe.z,null)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||j.intersectsObject(A))){const Fe=G.update(A),Be=A.material;if(Z&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),qe.copy(A.boundingSphere.center)):(Fe.boundingSphere===null&&Fe.computeBoundingSphere(),qe.copy(Fe.boundingSphere.center)),qe.applyMatrix4(A.matrixWorld).applyMatrix4(we)),Array.isArray(Be)){const ke=Fe.groups;for(let tt=0,it=ke.length;tt<it;tt++){const Ve=ke[tt],mt=Be[Ve.materialIndex];mt&&mt.visible&&m.push(A,Fe,mt,Y,qe.z,Ve)}}else Be.visible&&m.push(A,Fe,Be,Y,qe.z,null)}}const xe=A.children;for(let Fe=0,Be=xe.length;Fe<Be;Fe++)ft(xe[Fe],U,Y,Z)}function ie(A,U,Y,Z){const W=A.opaque,xe=A.transmissive,Fe=A.transparent;u.setupLightsView(Y),le===!0&&ee.setGlobalState(v.clippingPlanes,Y),Z&&ce.viewport(P.copy(Z)),W.length>0&&ze(W,U,Y),xe.length>0&&ze(xe,U,Y),Fe.length>0&&ze(Fe,U,Y),ce.buffers.depth.setTest(!0),ce.buffers.depth.setMask(!0),ce.buffers.color.setMask(!0),ce.setPolygonOffset(!1)}function He(A,U,Y,Z){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;u.state.transmissionRenderTarget[Z.id]===void 0&&(u.state.transmissionRenderTarget[Z.id]=new vn(1,1,{generateMipmaps:!0,type:be.has("EXT_color_buffer_half_float")||be.has("EXT_color_buffer_float")?Pn:qn,minFilter:Ei,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ht.workingColorSpace}));const xe=u.state.transmissionRenderTarget[Z.id],Fe=Z.viewport||P;xe.setSize(Fe.z,Fe.w);const Be=v.getRenderTarget();v.setRenderTarget(xe),v.getClearColor(X),q=v.getClearAlpha(),q<1&&v.setClearColor(16777215,.5),v.clear(),$e&&Ce.render(Y);const ke=v.toneMapping;v.toneMapping=hi;const tt=Z.viewport;if(Z.viewport!==void 0&&(Z.viewport=void 0),u.setupLightsView(Z),le===!0&&ee.setGlobalState(v.clippingPlanes,Z),ze(A,Y,Z),R.updateMultisampleRenderTarget(xe),R.updateRenderTargetMipmap(xe),be.has("WEBGL_multisampled_render_to_texture")===!1){let it=!1;for(let Ve=0,mt=U.length;Ve<mt;Ve++){const Tt=U[Ve],Et=Tt.object,$t=Tt.geometry,xt=Tt.material,Xe=Tt.group;if(xt.side===Bt&&Et.layers.test(Z.layers)){const Rn=xt.side;xt.side=Lt,xt.needsUpdate=!0,Oe(Et,Y,Z,$t,xt,Xe),xt.side=Rn,xt.needsUpdate=!0,it=!0}}it===!0&&(R.updateMultisampleRenderTarget(xe),R.updateRenderTargetMipmap(xe))}v.setRenderTarget(Be),v.setClearColor(X,q),tt!==void 0&&(Z.viewport=tt),v.toneMapping=ke}function ze(A,U,Y){const Z=U.isScene===!0?U.overrideMaterial:null;for(let W=0,xe=A.length;W<xe;W++){const Fe=A[W],Be=Fe.object,ke=Fe.geometry,tt=Z===null?Fe.material:Z,it=Fe.group;Be.layers.test(Y.layers)&&Oe(Be,U,Y,ke,tt,it)}}function Oe(A,U,Y,Z,W,xe){A.onBeforeRender(v,U,Y,Z,W,xe),A.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),W.onBeforeRender(v,U,Y,Z,A,xe),W.transparent===!0&&W.side===Bt&&W.forceSinglePass===!1?(W.side=Lt,W.needsUpdate=!0,v.renderBufferDirect(Y,U,Z,W,A,xe),W.side=Xn,W.needsUpdate=!0,v.renderBufferDirect(Y,U,Z,W,A,xe),W.side=Bt):v.renderBufferDirect(Y,U,Z,W,A,xe),A.onAfterRender(v,U,Y,Z,W,xe)}function et(A,U,Y){U.isScene!==!0&&(U=Je);const Z=pe.get(A),W=u.state.lights,xe=u.state.shadowsArray,Fe=W.state.version,Be=te.getParameters(A,W.state,xe,U,Y),ke=te.getProgramCacheKey(Be);let tt=Z.programs;Z.environment=A.isMeshStandardMaterial?U.environment:null,Z.fog=U.fog,Z.envMap=(A.isMeshStandardMaterial?k:b).get(A.envMap||Z.environment),Z.envMapRotation=Z.environment!==null&&A.envMap===null?U.environmentRotation:A.envMapRotation,tt===void 0&&(A.addEventListener("dispose",ye),tt=new Map,Z.programs=tt);let it=tt.get(ke);if(it!==void 0){if(Z.currentProgram===it&&Z.lightsStateVersion===Fe)return pt(A,Be),it}else Be.uniforms=te.getUniforms(A),A.onBeforeCompile(Be,v),it=te.acquireProgram(Be,ke),tt.set(ke,it),Z.uniforms=Be.uniforms;const Ve=Z.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Ve.clippingPlanes=ee.uniform),pt(A,Be),Z.needsLights=zt(A),Z.lightsStateVersion=Fe,Z.needsLights&&(Ve.ambientLightColor.value=W.state.ambient,Ve.lightProbe.value=W.state.probe,Ve.directionalLights.value=W.state.directional,Ve.directionalLightShadows.value=W.state.directionalShadow,Ve.spotLights.value=W.state.spot,Ve.spotLightShadows.value=W.state.spotShadow,Ve.rectAreaLights.value=W.state.rectArea,Ve.ltc_1.value=W.state.rectAreaLTC1,Ve.ltc_2.value=W.state.rectAreaLTC2,Ve.pointLights.value=W.state.point,Ve.pointLightShadows.value=W.state.pointShadow,Ve.hemisphereLights.value=W.state.hemi,Ve.directionalShadowMap.value=W.state.directionalShadowMap,Ve.directionalShadowMatrix.value=W.state.directionalShadowMatrix,Ve.spotShadowMap.value=W.state.spotShadowMap,Ve.spotLightMatrix.value=W.state.spotLightMatrix,Ve.spotLightMap.value=W.state.spotLightMap,Ve.pointShadowMap.value=W.state.pointShadowMap,Ve.pointShadowMatrix.value=W.state.pointShadowMatrix),Z.currentProgram=it,Z.uniformsList=null,it}function Mt(A){if(A.uniformsList===null){const U=A.currentProgram.getUniforms();A.uniformsList=Wr.seqWithValue(U.seq,A.uniforms)}return A.uniformsList}function pt(A,U){const Y=pe.get(A);Y.outputColorSpace=U.outputColorSpace,Y.batching=U.batching,Y.batchingColor=U.batchingColor,Y.instancing=U.instancing,Y.instancingColor=U.instancingColor,Y.instancingMorph=U.instancingMorph,Y.skinning=U.skinning,Y.morphTargets=U.morphTargets,Y.morphNormals=U.morphNormals,Y.morphColors=U.morphColors,Y.morphTargetsCount=U.morphTargetsCount,Y.numClippingPlanes=U.numClippingPlanes,Y.numIntersection=U.numClipIntersection,Y.vertexAlphas=U.vertexAlphas,Y.vertexTangents=U.vertexTangents,Y.toneMapping=U.toneMapping}function Pt(A,U,Y,Z,W){U.isScene!==!0&&(U=Je),R.resetTextureUnits();const xe=U.fog,Fe=Z.isMeshStandardMaterial?U.environment:null,Be=C===null?v.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:ga,ke=(Z.isMeshStandardMaterial?k:b).get(Z.envMap||Fe),tt=Z.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,it=!!Y.attributes.tangent&&(!!Z.normalMap||Z.anisotropy>0),Ve=!!Y.morphAttributes.position,mt=!!Y.morphAttributes.normal,Tt=!!Y.morphAttributes.color;let Et=hi;Z.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(Et=v.toneMapping);const $t=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,xt=$t!==void 0?$t.length:0,Xe=pe.get(Z),Rn=u.state.lights;if(le===!0&&(Te===!0||A!==_)){const dn=A===_&&Z.id===y;ee.setState(Z,A,dn)}let _t=!1;Z.version===Xe.__version?(Xe.needsLights&&Xe.lightsStateVersion!==Rn.state.version||Xe.outputColorSpace!==Be||W.isBatchedMesh&&Xe.batching===!1||!W.isBatchedMesh&&Xe.batching===!0||W.isBatchedMesh&&Xe.batchingColor===!0&&W.colorTexture===null||W.isBatchedMesh&&Xe.batchingColor===!1&&W.colorTexture!==null||W.isInstancedMesh&&Xe.instancing===!1||!W.isInstancedMesh&&Xe.instancing===!0||W.isSkinnedMesh&&Xe.skinning===!1||!W.isSkinnedMesh&&Xe.skinning===!0||W.isInstancedMesh&&Xe.instancingColor===!0&&W.instanceColor===null||W.isInstancedMesh&&Xe.instancingColor===!1&&W.instanceColor!==null||W.isInstancedMesh&&Xe.instancingMorph===!0&&W.morphTexture===null||W.isInstancedMesh&&Xe.instancingMorph===!1&&W.morphTexture!==null||Xe.envMap!==ke||Z.fog===!0&&Xe.fog!==xe||Xe.numClippingPlanes!==void 0&&(Xe.numClippingPlanes!==ee.numPlanes||Xe.numIntersection!==ee.numIntersection)||Xe.vertexAlphas!==tt||Xe.vertexTangents!==it||Xe.morphTargets!==Ve||Xe.morphNormals!==mt||Xe.morphColors!==Tt||Xe.toneMapping!==Et||Xe.morphTargetsCount!==xt)&&(_t=!0):(_t=!0,Xe.__version=Z.version);let gn=Xe.currentProgram;_t===!0&&(gn=et(Z,U,W));let Fi=!1,tn=!1,Sa=!1;const Ct=gn.getUniforms(),wn=Xe.uniforms;if(ce.useProgram(gn.program)&&(Fi=!0,tn=!0,Sa=!0),Z.id!==y&&(y=Z.id,tn=!0),Fi||_!==A){ce.buffers.depth.getReversed()?(fe.copy(A.projectionMatrix),Pd(fe),Rd(fe),Ct.setValue(z,"projectionMatrix",fe)):Ct.setValue(z,"projectionMatrix",A.projectionMatrix),Ct.setValue(z,"viewMatrix",A.matrixWorldInverse);const $n=Ct.map.cameraPosition;$n!==void 0&&$n.setValue(z,ve.setFromMatrixPosition(A.matrixWorld)),J.logarithmicDepthBuffer&&Ct.setValue(z,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(Z.isMeshPhongMaterial||Z.isMeshToonMaterial||Z.isMeshLambertMaterial||Z.isMeshBasicMaterial||Z.isMeshStandardMaterial||Z.isShaderMaterial)&&Ct.setValue(z,"isOrthographic",A.isOrthographicCamera===!0),_!==A&&(_=A,tn=!0,Sa=!0)}if(W.isSkinnedMesh){Ct.setOptional(z,W,"bindMatrix"),Ct.setOptional(z,W,"bindMatrixInverse");const dn=W.skeleton;dn&&(dn.boneTexture===null&&dn.computeBoneTexture(),Ct.setValue(z,"boneTexture",dn.boneTexture,R))}W.isBatchedMesh&&(Ct.setOptional(z,W,"batchingTexture"),Ct.setValue(z,"batchingTexture",W._matricesTexture,R),Ct.setOptional(z,W,"batchingIdTexture"),Ct.setValue(z,"batchingIdTexture",W._indirectTexture,R),Ct.setOptional(z,W,"batchingColorTexture"),W._colorsTexture!==null&&Ct.setValue(z,"batchingColorTexture",W._colorsTexture,R));const wa=Y.morphAttributes;if((wa.position!==void 0||wa.normal!==void 0||wa.color!==void 0)&&Ie.update(W,Y,gn),(tn||Xe.receiveShadow!==W.receiveShadow)&&(Xe.receiveShadow=W.receiveShadow,Ct.setValue(z,"receiveShadow",W.receiveShadow)),Z.isMeshGouraudMaterial&&Z.envMap!==null&&(wn.envMap.value=ke,wn.flipEnvMap.value=ke.isCubeTexture&&ke.isRenderTargetTexture===!1?-1:1),Z.isMeshStandardMaterial&&Z.envMap===null&&U.environment!==null&&(wn.envMapIntensity.value=U.environmentIntensity),tn&&(Ct.setValue(z,"toneMappingExposure",v.toneMappingExposure),Xe.needsLights&&Ut(wn,Sa),xe&&Z.fog===!0&&O.refreshFogUniforms(wn,xe),O.refreshMaterialUniforms(wn,Z,H,K,u.state.transmissionRenderTarget[A.id]),Wr.upload(z,Mt(Xe),wn,R)),Z.isShaderMaterial&&Z.uniformsNeedUpdate===!0&&(Wr.upload(z,Mt(Xe),wn,R),Z.uniformsNeedUpdate=!1),Z.isSpriteMaterial&&Ct.setValue(z,"center",W.center),Ct.setValue(z,"modelViewMatrix",W.modelViewMatrix),Ct.setValue(z,"normalMatrix",W.normalMatrix),Ct.setValue(z,"modelMatrix",W.matrixWorld),Z.isShaderMaterial||Z.isRawShaderMaterial){const dn=Z.uniformsGroups;for(let $n=0,Kn=dn.length;$n<Kn;$n++){const fl=dn[$n];L.update(fl,gn),L.bind(fl,gn)}}return gn}function Ut(A,U){A.ambientLightColor.needsUpdate=U,A.lightProbe.needsUpdate=U,A.directionalLights.needsUpdate=U,A.directionalLightShadows.needsUpdate=U,A.pointLights.needsUpdate=U,A.pointLightShadows.needsUpdate=U,A.spotLights.needsUpdate=U,A.spotLightShadows.needsUpdate=U,A.rectAreaLights.needsUpdate=U,A.hemisphereLights.needsUpdate=U}function zt(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return E},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(A,U,Y){pe.get(A.texture).__webglTexture=U,pe.get(A.depthTexture).__webglTexture=Y;const Z=pe.get(A);Z.__hasExternalTextures=!0,Z.__autoAllocateDepthBuffer=Y===void 0,Z.__autoAllocateDepthBuffer||be.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),Z.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(A,U){const Y=pe.get(A);Y.__webglFramebuffer=U,Y.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(A,U=0,Y=0){C=A,w=U,E=Y;let Z=!0,W=null,xe=!1,Fe=!1;if(A){const ke=pe.get(A);if(ke.__useDefaultFramebuffer!==void 0)ce.bindFramebuffer(z.FRAMEBUFFER,null),Z=!1;else if(ke.__webglFramebuffer===void 0)R.setupRenderTarget(A);else if(ke.__hasExternalTextures)R.rebindTextures(A,pe.get(A.texture).__webglTexture,pe.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){const Ve=A.depthTexture;if(ke.__boundDepthTexture!==Ve){if(Ve!==null&&pe.has(Ve)&&(A.width!==Ve.image.width||A.height!==Ve.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");R.setupDepthRenderbuffer(A)}}const tt=A.texture;(tt.isData3DTexture||tt.isDataArrayTexture||tt.isCompressedArrayTexture)&&(Fe=!0);const it=pe.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(it[U])?W=it[U][Y]:W=it[U],xe=!0):A.samples>0&&R.useMultisampledRTT(A)===!1?W=pe.get(A).__webglMultisampledFramebuffer:Array.isArray(it)?W=it[Y]:W=it,P.copy(A.viewport),I.copy(A.scissor),F=A.scissorTest}else P.copy(de).multiplyScalar(H).floor(),I.copy(_e).multiplyScalar(H).floor(),F=Re;if(ce.bindFramebuffer(z.FRAMEBUFFER,W)&&Z&&ce.drawBuffers(A,W),ce.viewport(P),ce.scissor(I),ce.setScissorTest(F),xe){const ke=pe.get(A.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+U,ke.__webglTexture,Y)}else if(Fe){const ke=pe.get(A.texture),tt=U||0;z.framebufferTextureLayer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,ke.__webglTexture,Y||0,tt)}y=-1},this.readRenderTargetPixels=function(A,U,Y,Z,W,xe,Fe){if(!(A&&A.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Be=pe.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Fe!==void 0&&(Be=Be[Fe]),Be){ce.bindFramebuffer(z.FRAMEBUFFER,Be);try{const ke=A.texture,tt=ke.format,it=ke.type;if(!J.textureFormatReadable(tt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!J.textureTypeReadable(it)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=A.width-Z&&Y>=0&&Y<=A.height-W&&z.readPixels(U,Y,Z,W,ne.convert(tt),ne.convert(it),xe)}finally{const ke=C!==null?pe.get(C).__webglFramebuffer:null;ce.bindFramebuffer(z.FRAMEBUFFER,ke)}}},this.readRenderTargetPixelsAsync=async function(A,U,Y,Z,W,xe,Fe){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Be=pe.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Fe!==void 0&&(Be=Be[Fe]),Be){const ke=A.texture,tt=ke.format,it=ke.type;if(!J.textureFormatReadable(tt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!J.textureTypeReadable(it))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(U>=0&&U<=A.width-Z&&Y>=0&&Y<=A.height-W){ce.bindFramebuffer(z.FRAMEBUFFER,Be);const Ve=z.createBuffer();z.bindBuffer(z.PIXEL_PACK_BUFFER,Ve),z.bufferData(z.PIXEL_PACK_BUFFER,xe.byteLength,z.STREAM_READ),z.readPixels(U,Y,Z,W,ne.convert(tt),ne.convert(it),0);const mt=C!==null?pe.get(C).__webglFramebuffer:null;ce.bindFramebuffer(z.FRAMEBUFFER,mt);const Tt=z.fenceSync(z.SYNC_GPU_COMMANDS_COMPLETE,0);return z.flush(),await Cd(z,Tt,4),z.bindBuffer(z.PIXEL_PACK_BUFFER,Ve),z.getBufferSubData(z.PIXEL_PACK_BUFFER,0,xe),z.deleteBuffer(Ve),z.deleteSync(Tt),xe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(A,U=null,Y=0){A.isTexture!==!0&&(Fa("WebGLRenderer: copyFramebufferToTexture function signature has changed."),U=arguments[0]||null,A=arguments[1]);const Z=Math.pow(2,-Y),W=Math.floor(A.image.width*Z),xe=Math.floor(A.image.height*Z),Fe=U!==null?U.x:0,Be=U!==null?U.y:0;R.setTexture2D(A,0),z.copyTexSubImage2D(z.TEXTURE_2D,Y,0,0,Fe,Be,W,xe),ce.unbindTexture()},this.copyTextureToTexture=function(A,U,Y=null,Z=null,W=0){A.isTexture!==!0&&(Fa("WebGLRenderer: copyTextureToTexture function signature has changed."),Z=arguments[0]||null,A=arguments[1],U=arguments[2],W=arguments[3]||0,Y=null);let xe,Fe,Be,ke,tt,it,Ve,mt,Tt;const Et=A.isCompressedTexture?A.mipmaps[W]:A.image;Y!==null?(xe=Y.max.x-Y.min.x,Fe=Y.max.y-Y.min.y,Be=Y.isBox3?Y.max.z-Y.min.z:1,ke=Y.min.x,tt=Y.min.y,it=Y.isBox3?Y.min.z:0):(xe=Et.width,Fe=Et.height,Be=Et.depth||1,ke=0,tt=0,it=0),Z!==null?(Ve=Z.x,mt=Z.y,Tt=Z.z):(Ve=0,mt=0,Tt=0);const $t=ne.convert(U.format),xt=ne.convert(U.type);let Xe;U.isData3DTexture?(R.setTexture3D(U,0),Xe=z.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(R.setTexture2DArray(U,0),Xe=z.TEXTURE_2D_ARRAY):(R.setTexture2D(U,0),Xe=z.TEXTURE_2D),z.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,U.flipY),z.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),z.pixelStorei(z.UNPACK_ALIGNMENT,U.unpackAlignment);const Rn=z.getParameter(z.UNPACK_ROW_LENGTH),_t=z.getParameter(z.UNPACK_IMAGE_HEIGHT),gn=z.getParameter(z.UNPACK_SKIP_PIXELS),Fi=z.getParameter(z.UNPACK_SKIP_ROWS),tn=z.getParameter(z.UNPACK_SKIP_IMAGES);z.pixelStorei(z.UNPACK_ROW_LENGTH,Et.width),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,Et.height),z.pixelStorei(z.UNPACK_SKIP_PIXELS,ke),z.pixelStorei(z.UNPACK_SKIP_ROWS,tt),z.pixelStorei(z.UNPACK_SKIP_IMAGES,it);const Sa=A.isDataArrayTexture||A.isData3DTexture,Ct=U.isDataArrayTexture||U.isData3DTexture;if(A.isRenderTargetTexture||A.isDepthTexture){const wn=pe.get(A),wa=pe.get(U),dn=pe.get(wn.__renderTarget),$n=pe.get(wa.__renderTarget);ce.bindFramebuffer(z.READ_FRAMEBUFFER,dn.__webglFramebuffer),ce.bindFramebuffer(z.DRAW_FRAMEBUFFER,$n.__webglFramebuffer);for(let Kn=0;Kn<Be;Kn++)Sa&&z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,pe.get(A).__webglTexture,W,it+Kn),A.isDepthTexture?(Ct&&z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,pe.get(U).__webglTexture,W,Tt+Kn),z.blitFramebuffer(ke,tt,xe,Fe,Ve,mt,xe,Fe,z.DEPTH_BUFFER_BIT,z.NEAREST)):Ct?z.copyTexSubImage3D(Xe,W,Ve,mt,Tt+Kn,ke,tt,xe,Fe):z.copyTexSubImage2D(Xe,W,Ve,mt,Tt+Kn,ke,tt,xe,Fe);ce.bindFramebuffer(z.READ_FRAMEBUFFER,null),ce.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else Ct?A.isDataTexture||A.isData3DTexture?z.texSubImage3D(Xe,W,Ve,mt,Tt,xe,Fe,Be,$t,xt,Et.data):U.isCompressedArrayTexture?z.compressedTexSubImage3D(Xe,W,Ve,mt,Tt,xe,Fe,Be,$t,Et.data):z.texSubImage3D(Xe,W,Ve,mt,Tt,xe,Fe,Be,$t,xt,Et):A.isDataTexture?z.texSubImage2D(z.TEXTURE_2D,W,Ve,mt,xe,Fe,$t,xt,Et.data):A.isCompressedTexture?z.compressedTexSubImage2D(z.TEXTURE_2D,W,Ve,mt,Et.width,Et.height,$t,Et.data):z.texSubImage2D(z.TEXTURE_2D,W,Ve,mt,xe,Fe,$t,xt,Et);z.pixelStorei(z.UNPACK_ROW_LENGTH,Rn),z.pixelStorei(z.UNPACK_IMAGE_HEIGHT,_t),z.pixelStorei(z.UNPACK_SKIP_PIXELS,gn),z.pixelStorei(z.UNPACK_SKIP_ROWS,Fi),z.pixelStorei(z.UNPACK_SKIP_IMAGES,tn),W===0&&U.generateMipmaps&&z.generateMipmap(Xe),ce.unbindTexture()},this.copyTextureToTexture3D=function(A,U,Y=null,Z=null,W=0){return A.isTexture!==!0&&(Fa("WebGLRenderer: copyTextureToTexture3D function signature has changed."),Y=arguments[0]||null,Z=arguments[1]||null,A=arguments[2],U=arguments[3],W=arguments[4]||0),Fa('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(A,U,Y,Z,W)},this.initRenderTarget=function(A){pe.get(A).__webglFramebuffer===void 0&&R.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?R.setTextureCube(A,0):A.isData3DTexture?R.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?R.setTexture2DArray(A,0):R.setTexture2D(A,0),ce.unbindTexture()},this.resetState=function(){w=0,E=0,C=null,ce.reset(),Se.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return kn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorspace=ht._getDrawingBufferColorSpace(e),t.unpackColorSpace=ht._getUnpackColorSpace()}}class no{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new lt(e),this.density=t}clone(){return new no(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Ka extends Nt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Zn,this.environmentIntensity=1,this.environmentRotation=new Zn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class km extends jt{constructor(e=null,t=1,i=1,a,r,o,s,l,c=un,f=un,d,h){super(null,o,s,l,c,f,a,r,d,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Bn extends De{constructor(e,t,i,a=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=a}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const ji=new yt,dc=new yt,yr=[],hc=new Ni,Vm=new yt,Pa=new ut,Ra=new xa;class Ua extends ut{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Bn(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let a=0;a<i;a++)this.setMatrixAt(a,Vm)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ni),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,ji),hc.copy(e.boundingBox).applyMatrix4(ji),this.boundingBox.union(hc)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new xa),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,ji),Ra.copy(e.boundingSphere).applyMatrix4(ji),this.boundingSphere.union(Ra)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const i=t.morphTargetInfluences,a=this.morphTexture.source.data.data,r=i.length+1,o=e*r+1;for(let s=0;s<i.length;s++)i[s]=a[o+s]}raycast(e,t){const i=this.matrixWorld,a=this.count;if(Pa.geometry=this.geometry,Pa.material=this.material,Pa.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ra.copy(this.boundingSphere),Ra.applyMatrix4(i),e.ray.intersectsSphere(Ra)!==!1))for(let r=0;r<a;r++){this.getMatrixAt(r,ji),dc.multiplyMatrices(i,ji),Pa.matrixWorld=dc,Pa.raycast(e,yr);for(let o=0,s=yr.length;o<s;o++){const l=yr[o];l.instanceId=r,l.object=this,t.push(l)}yr.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Bn(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const i=t.morphTargetInfluences,a=i.length+1;this.morphTexture===null&&(this.morphTexture=new km(new Float32Array(a*this.count),a,this.count,Xs,Cn));const r=this.morphTexture.source.data.data;let o=0;for(let c=0;c<i.length;c++)o+=i[c];const s=this.geometry.morphTargetsRelative?1:1-o,l=a*e;r[l]=s,r.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class Wm extends ja{static get type(){return"PointsMaterial"}constructor(e){super(),this.isPointsMaterial=!0,this.color=new lt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const fc=new yt,Is=new eo,Mr=new xa,Sr=new D;class Vn extends Nt{constructor(e=new st,t=new Wm){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const i=this.geometry,a=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Mr.copy(i.boundingSphere),Mr.applyMatrix4(a),Mr.radius+=r,e.ray.intersectsSphere(Mr)===!1)return;fc.copy(a).invert(),Is.copy(e.ray).applyMatrix4(fc);const s=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=s*s,c=i.index,d=i.attributes.position;if(c!==null){const h=Math.max(0,o.start),p=Math.min(c.count,o.start+o.count);for(let g=h,x=p;g<x;g++){const m=c.getX(g);Sr.fromBufferAttribute(d,m),pc(Sr,m,l,a,e,t,this)}}else{const h=Math.max(0,o.start),p=Math.min(d.count,o.start+o.count);for(let g=h,x=p;g<x;g++)Sr.fromBufferAttribute(d,g),pc(Sr,g,l,a,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const a=t[i[0]];if(a!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=a.length;r<o;r++){const s=a[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=r}}}}}function pc(n,e,t,i,a,r,o){const s=Is.distanceSqToPoint(n);if(s<t){const l=new D;Is.closestPointToPoint(n,l),l.applyMatrix4(i);const c=a.ray.origin.distanceTo(l);if(c<a.near||c>a.far)return;r.push({distance:c,distanceToRay:Math.sqrt(s),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}class el extends st{constructor(e=[new Le(0,-.5),new Le(.5,0),new Le(0,.5)],t=12,i=0,a=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:a},t=Math.floor(t),a=qt(a,0,Math.PI*2);const r=[],o=[],s=[],l=[],c=[],f=1/t,d=new D,h=new Le,p=new D,g=new D,x=new D;let m=0,u=0;for(let M=0;M<=e.length-1;M++)switch(M){case 0:m=e[M+1].x-e[M].x,u=e[M+1].y-e[M].y,p.x=u*1,p.y=-m,p.z=u*0,x.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(x.x,x.y,x.z);break;default:m=e[M+1].x-e[M].x,u=e[M+1].y-e[M].y,p.x=u*1,p.y=-m,p.z=u*0,g.copy(p),p.x+=x.x,p.y+=x.y,p.z+=x.z,p.normalize(),l.push(p.x,p.y,p.z),x.copy(g)}for(let M=0;M<=t;M++){const S=i+M*f*a,v=Math.sin(S),T=Math.cos(S);for(let w=0;w<=e.length-1;w++){d.x=e[w].x*v,d.y=e[w].y,d.z=e[w].x*T,o.push(d.x,d.y,d.z),h.x=M/t,h.y=w/(e.length-1),s.push(h.x,h.y);const E=l[3*w+0]*v,C=l[3*w+1],y=l[3*w+0]*T;c.push(E,C,y)}}for(let M=0;M<t;M++)for(let S=0;S<e.length-1;S++){const v=S+M*e.length,T=v,w=v+e.length,E=v+e.length+1,C=v+1;r.push(T,w,C),r.push(E,C,w)}this.setIndex(r),this.setAttribute("position",new ct(o,3)),this.setAttribute("uv",new ct(s,2)),this.setAttribute("normal",new ct(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new el(e.points,e.segments,e.phiStart,e.phiLength)}}class tl extends st{constructor(e=[],t=[],i=1,a=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:a};const r=[],o=[];s(a),c(i),f(),this.setAttribute("position",new ct(r,3)),this.setAttribute("normal",new ct(r.slice(),3)),this.setAttribute("uv",new ct(o,2)),a===0?this.computeVertexNormals():this.normalizeNormals();function s(M){const S=new D,v=new D,T=new D;for(let w=0;w<t.length;w+=3)p(t[w+0],S),p(t[w+1],v),p(t[w+2],T),l(S,v,T,M)}function l(M,S,v,T){const w=T+1,E=[];for(let C=0;C<=w;C++){E[C]=[];const y=M.clone().lerp(v,C/w),_=S.clone().lerp(v,C/w),P=w-C;for(let I=0;I<=P;I++)I===0&&C===w?E[C][I]=y:E[C][I]=y.clone().lerp(_,I/P)}for(let C=0;C<w;C++)for(let y=0;y<2*(w-C)-1;y++){const _=Math.floor(y/2);y%2===0?(h(E[C][_+1]),h(E[C+1][_]),h(E[C][_])):(h(E[C][_+1]),h(E[C+1][_+1]),h(E[C+1][_]))}}function c(M){const S=new D;for(let v=0;v<r.length;v+=3)S.x=r[v+0],S.y=r[v+1],S.z=r[v+2],S.normalize().multiplyScalar(M),r[v+0]=S.x,r[v+1]=S.y,r[v+2]=S.z}function f(){const M=new D;for(let S=0;S<r.length;S+=3){M.x=r[S+0],M.y=r[S+1],M.z=r[S+2];const v=m(M)/2/Math.PI+.5,T=u(M)/Math.PI+.5;o.push(v,1-T)}g(),d()}function d(){for(let M=0;M<o.length;M+=6){const S=o[M+0],v=o[M+2],T=o[M+4],w=Math.max(S,v,T),E=Math.min(S,v,T);w>.9&&E<.1&&(S<.2&&(o[M+0]+=1),v<.2&&(o[M+2]+=1),T<.2&&(o[M+4]+=1))}}function h(M){r.push(M.x,M.y,M.z)}function p(M,S){const v=M*3;S.x=e[v+0],S.y=e[v+1],S.z=e[v+2]}function g(){const M=new D,S=new D,v=new D,T=new D,w=new Le,E=new Le,C=new Le;for(let y=0,_=0;y<r.length;y+=9,_+=6){M.set(r[y+0],r[y+1],r[y+2]),S.set(r[y+3],r[y+4],r[y+5]),v.set(r[y+6],r[y+7],r[y+8]),w.set(o[_+0],o[_+1]),E.set(o[_+2],o[_+3]),C.set(o[_+4],o[_+5]),T.copy(M).add(S).add(v).divideScalar(3);const P=m(T);x(w,_+0,M,P),x(E,_+2,S,P),x(C,_+4,v,P)}}function x(M,S,v,T){T<0&&M.x===1&&(o[S]=M.x-1),v.x===0&&v.z===0&&(o[S]=T/2/Math.PI+.5)}function m(M){return Math.atan2(M.z,-M.x)}function u(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new tl(e.vertices,e.indices,e.radius,e.details)}}class io extends tl{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,a=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(a,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new io(e.radius,e.detail)}}class ya extends st{constructor(e=1,t=32,i=16,a=0,r=Math.PI*2,o=0,s=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:a,phiLength:r,thetaStart:o,thetaLength:s},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(o+s,Math.PI);let c=0;const f=[],d=new D,h=new D,p=[],g=[],x=[],m=[];for(let u=0;u<=i;u++){const M=[],S=u/i;let v=0;u===0&&o===0?v=.5/t:u===i&&l===Math.PI&&(v=-.5/t);for(let T=0;T<=t;T++){const w=T/t;d.x=-e*Math.cos(a+w*r)*Math.sin(o+S*s),d.y=e*Math.cos(o+S*s),d.z=e*Math.sin(a+w*r)*Math.sin(o+S*s),g.push(d.x,d.y,d.z),h.copy(d).normalize(),x.push(h.x,h.y,h.z),m.push(w+v,1-S),M.push(c++)}f.push(M)}for(let u=0;u<i;u++)for(let M=0;M<t;M++){const S=f[u][M+1],v=f[u][M],T=f[u+1][M],w=f[u+1][M+1];(u!==0||o>0)&&p.push(S,v,w),(u!==i-1||l<Math.PI)&&p.push(v,T,w)}this.setIndex(p),this.setAttribute("position",new ct(g,3)),this.setAttribute("normal",new ct(x,3)),this.setAttribute("uv",new ct(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ya(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Gm extends Ke{static get type(){return"RawShaderMaterial"}constructor(e){super(e),this.isRawShaderMaterial=!0}}class nl extends Nt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new lt(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}class ao extends nl{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Nt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new lt(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const Vo=new yt,mc=new D,vc=new D;class Ru{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Le(512,512),this.map=null,this.mapPass=null,this.matrix=new yt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ks,this._frameExtents=new Le(1,1),this._viewportCount=1,this._viewports=[new wt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;mc.setFromMatrixPosition(e.matrixWorld),t.position.copy(mc),vc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(vc),t.updateMatrixWorld(),Vo.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Vo),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Vo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const gc=new yt,Da=new D,Wo=new D;class Hm extends Ru{constructor(){super(new Qt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Le(4,2),this._viewportCount=6,this._viewports=[new wt(2,1,1,1),new wt(0,1,1,1),new wt(3,1,1,1),new wt(1,1,1,1),new wt(3,0,1,1),new wt(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(e,t=0){const i=this.camera,a=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),Da.setFromMatrixPosition(e.matrixWorld),i.position.copy(Da),Wo.copy(i.position),Wo.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(Wo),i.updateMatrixWorld(),a.makeTranslation(-Da.x,-Da.y,-Da.z),gc.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(gc)}}class xc extends nl{constructor(e,t,i=0,a=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=a,this.shadow=new Hm}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class Xm extends Ru{constructor(){super(new Js(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ro extends nl{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Nt.DEFAULT_UP),this.updateMatrix(),this.target=new Nt,this.shadow=new Xm}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Du{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=_c(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=_c();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function _c(){return performance.now()}const yc=new yt;class qm{constructor(e,t,i=0,a=1/0){this.ray=new eo(e,t),this.near=i,this.far=a,this.camera=null,this.layers=new js,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return yc.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(yc),this}intersectObject(e,t=!0,i=[]){return Us(e,this,i,t),i.sort(Mc),i}intersectObjects(e,t=!0,i=[]){for(let a=0,r=e.length;a<r;a++)Us(e[a],this,i,t);return i.sort(Mc),i}}function Mc(n,e){return n.distance-e.distance}function Us(n,e,t,i){let a=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(a=!1),a===!0&&i===!0){const r=n.children;for(let o=0,s=r.length;o<s;o++)Us(r[o],e,t,!0)}}class Sc{constructor(e=1,t=0,i=0){return this.radius=e,this.phi=t,this.theta=i,this}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(qt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class Ym extends Li{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ks}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ks);const wc={type:"change"},il={type:"start"},Lu={type:"end"},wr=new eo,bc=new On,Zm=Math.cos(70*Ad.DEG2RAD),Dt=new D,Jt=2*Math.PI,bt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Go=1e-6;class jm extends Ym{constructor(e,t=null){super(e,t),this.state=bt.NONE,this.enabled=!0,this.target=new D,this.cursor=new D,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ra.ROTATE,MIDDLE:ra.DOLLY,RIGHT:ra.PAN},this.touches={ONE:Qi.ROTATE,TWO:Qi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new D,this._lastQuaternion=new Yn,this._lastTargetPosition=new D,this._quat=new Yn().setFromUnitVectors(e.up,new D(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Sc,this._sphericalDelta=new Sc,this._scale=1,this._panOffset=new D,this._rotateStart=new Le,this._rotateEnd=new Le,this._rotateDelta=new Le,this._panStart=new Le,this._panEnd=new Le,this._panDelta=new Le,this._dollyStart=new Le,this._dollyEnd=new Le,this._dollyDelta=new Le,this._dollyDirection=new D,this._mouse=new Le,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Km.bind(this),this._onPointerDown=$m.bind(this),this._onPointerUp=Jm.bind(this),this._onContextMenu=rv.bind(this),this._onMouseWheel=tv.bind(this),this._onKeyDown=nv.bind(this),this._onTouchStart=iv.bind(this),this._onTouchMove=av.bind(this),this._onMouseDown=Qm.bind(this),this._onMouseMove=ev.bind(this),this._interceptControlDown=ov.bind(this),this._interceptControlUp=sv.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(wc),this.update(),this.state=bt.NONE}update(e=null){const t=this.object.position;Dt.copy(t).sub(this.target),Dt.applyQuaternion(this._quat),this._spherical.setFromVector3(Dt),this.autoRotate&&this.state===bt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,a=this.maxAzimuthAngle;isFinite(i)&&isFinite(a)&&(i<-Math.PI?i+=Jt:i>Math.PI&&(i-=Jt),a<-Math.PI?a+=Jt:a>Math.PI&&(a-=Jt),i<=a?this._spherical.theta=Math.max(i,Math.min(a,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+a)/2?Math.max(i,this._spherical.theta):Math.min(a,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Dt.setFromSpherical(this._spherical),Dt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Dt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const s=Dt.length();o=this._clampDistance(s*this._scale);const l=s-o;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){const s=new D(this._mouse.x,this._mouse.y,0);s.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;const c=new D(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(s),this.object.updateMatrixWorld(),o=Dt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(wr.origin.copy(this.object.position),wr.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(wr.direction))<Zm?this.object.lookAt(this.target):(bc.setFromNormalAndCoplanarPoint(this.object.up,this.target),wr.intersectPlane(bc,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Go||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Go||this._lastTargetPosition.distanceToSquared(this.target)>Go?(this.dispatchEvent(wc),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Jt/60*this.autoRotateSpeed*e:Jt/60/60*this.autoRotateSpeed}_getZoomScale(e){const t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Dt.setFromMatrixColumn(t,0),Dt.multiplyScalar(-e),this._panOffset.add(Dt)}_panUp(e,t){this.screenSpacePanning===!0?Dt.setFromMatrixColumn(t,1):(Dt.setFromMatrixColumn(t,0),Dt.crossVectors(this.object.up,Dt)),Dt.multiplyScalar(e),this._panOffset.add(Dt)}_pan(e,t){const i=this.domElement;if(this.object.isPerspectiveCamera){const a=this.object.position;Dt.copy(a).sub(this.target);let r=Dt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/i.clientHeight,this.object.matrix),this._panUp(2*t*r/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),a=e-i.left,r=t-i.top,o=i.width,s=i.height;this._mouse.x=a/o*2-1,this._mouse.y=-(r/s)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft(Jt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Jt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(Jt*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(-Jt*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(Jt*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(-Jt*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),a=.5*(e.pageY+t.y);this._rotateStart.set(i,a)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),a=.5*(e.pageY+t.y);this._panStart.set(i,a)}}_handleTouchStartDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,a=e.pageY-t.y,r=Math.sqrt(i*i+a*a);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),a=.5*(e.pageX+i.x),r=.5*(e.pageY+i.y);this._rotateEnd.set(a,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft(Jt*this._rotateDelta.x/t.clientHeight),this._rotateUp(Jt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),a=.5*(e.pageY+t.y);this._panEnd.set(i,a)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,a=e.pageY-t.y,r=Math.sqrt(i*i+a*a);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(e.pageX+t.x)*.5,s=(e.pageY+t.y)*.5;this._updateZoomParameters(o,s)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new Le,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){const t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function $m(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function Km(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function Jm(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Lu),this.state=bt.NONE;break;case 1:const e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Qm(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case ra.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=bt.DOLLY;break;case ra.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=bt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=bt.ROTATE}break;case ra.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=bt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=bt.PAN}break;default:this.state=bt.NONE}this.state!==bt.NONE&&this.dispatchEvent(il)}function ev(n){switch(this.state){case bt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case bt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case bt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function tv(n){this.enabled===!1||this.enableZoom===!1||this.state!==bt.NONE||(n.preventDefault(),this.dispatchEvent(il),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(Lu))}function nv(n){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(n)}function iv(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case Qi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=bt.TOUCH_ROTATE;break;case Qi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=bt.TOUCH_PAN;break;default:this.state=bt.NONE}break;case 2:switch(this.touches.TWO){case Qi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=bt.TOUCH_DOLLY_PAN;break;case Qi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=bt.TOUCH_DOLLY_ROTATE;break;default:this.state=bt.NONE}break;default:this.state=bt.NONE}this.state!==bt.NONE&&this.dispatchEvent(il)}function av(n){switch(this._trackPointer(n),this.state){case bt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case bt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case bt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case bt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=bt.NONE}}function rv(n){this.enabled!==!1&&n.preventDefault()}function ov(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function sv(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const Nu={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class Ma{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const lv=new Js(-1,1,1,-1,0,1);class cv extends st{constructor(){super(),this.setAttribute("position",new ct([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new ct([0,2,0,0,2,0],2))}}const uv=new cv;class al{constructor(e){this._mesh=new ut(uv,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,lv)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Fu extends Ma{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof Ke?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Xa.clone(e.uniforms),this.material=new Ke({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new al(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class Tc extends Ma{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){const a=e.getContext(),r=e.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,s;this.inverse?(o=0,s=1):(o=1,s=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),r.buffers.stencil.setFunc(a.ALWAYS,o,4294967295),r.buffers.stencil.setClear(s),r.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(a.EQUAL,1,4294967295),r.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),r.buffers.stencil.setLocked(!0)}}class dv extends Ma{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class hv{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const i=e.getSize(new Le);this._width=i.width,this._height=i.height,t=new vn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Pn}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Fu(Nu),this.copyPass.material.blending=Wn,this.clock=new Du}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let i=!1;for(let a=0,r=this.passes.length;a<r;a++){const o=this.passes[a];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(a),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),o.needsSwap){if(i){const s=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(s.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(s.EQUAL,1,4294967295)}this.swapBuffers()}Tc!==void 0&&(o instanceof Tc?i=!0:o instanceof dv&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new Le);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const i=this._width*this._pixelRatio,a=this._height*this._pixelRatio;this.renderTarget1.setSize(i,a),this.renderTarget2.setSize(i,a);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(i,a)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class fv extends Ma{constructor(e,t,i=null,a=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=i,this.clearColor=a,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new lt}render(e,t,i){const a=e.autoClear;e.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=a}}const pv={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new lt(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class ma extends Ma{constructor(e,t,i,a){super(),this.strength=t!==void 0?t:1,this.radius=i,this.threshold=a,this.resolution=e!==void 0?new Le(e.x,e.y):new Le(256,256),this.clearColor=new lt(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new vn(r,o,{type:Pn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let d=0;d<this.nMips;d++){const h=new vn(r,o,{type:Pn});h.texture.name="UnrealBloomPass.h"+d,h.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(h);const p=new vn(r,o,{type:Pn});p.texture.name="UnrealBloomPass.v"+d,p.texture.generateMipmaps=!1,this.renderTargetsVertical.push(p),r=Math.round(r/2),o=Math.round(o/2)}const s=pv;this.highPassUniforms=Xa.clone(s.uniforms),this.highPassUniforms.luminosityThreshold.value=a,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Ke({uniforms:this.highPassUniforms,vertexShader:s.vertexShader,fragmentShader:s.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let d=0;d<this.nMips;d++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[d])),this.separableBlurMaterials[d].uniforms.invSize.value=new Le(1/r,1/o),r=Math.round(r/2),o=Math.round(o/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new D(1,1,1),new D(1,1,1),new D(1,1,1),new D(1,1,1),new D(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const f=Nu;this.copyUniforms=Xa.clone(f.uniforms),this.blendMaterial=new Ke({uniforms:this.copyUniforms,vertexShader:f.vertexShader,fragmentShader:f.fragmentShader,blending:Pi,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new lt,this.oldClearAlpha=1,this.basic=new $s,this.fsQuad=new al(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,t){let i=Math.round(e/2),a=Math.round(t/2);this.renderTargetBright.setSize(i,a);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(i,a),this.renderTargetsVertical[r].setSize(i,a),this.separableBlurMaterials[r].uniforms.invSize.value=new Le(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2)}render(e,t,i,a,r){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();const o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),r&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=i.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let s=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[l].uniforms.direction.value=ma.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=ma.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),s=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(i),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=o}getSeperableBlurMaterial(e){const t=[];for(let i=0;i<e;i++)t.push(.39894*Math.exp(-.5*i*i/(e*e))/e);return new Ke({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new Le(.5,.5)},direction:{value:new Le(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new Ke({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}ma.BlurDirectionX=new Le(1,0);ma.BlurDirectionY=new Le(0,1);const mv={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class vv extends Ma{constructor(){super();const e=mv;this.uniforms=Xa.clone(e.uniforms),this.material=new Gm({name:e.name,uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader}),this.fsQuad=new al(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,i){this.uniforms.tDiffuse.value=i.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},ht.getTransfer(this._outputColorSpace)===St&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Qc?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===eu?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===tu?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Vs?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===nu?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===iu&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}const gv=.62,yi={all:{gains:{fire:.44,water:.54,earth:.54,air:.42},pans:{fire:-.4,water:.4,earth:-.25,air:.25},rates:{fire:.9,water:.9,earth:.9,air:.9}},sanctum:{gains:{fire:.44,water:.54,earth:.54,air:.42},pans:{fire:-.4,water:.4,earth:-.25,air:.25},rates:{fire:.9,water:.9,earth:.9,air:.9}},fire:{gains:{fire:1,water:0,earth:0,air:.14},pans:{fire:0,water:.4,earth:-.3,air:.15},rates:{fire:1.85,water:0,earth:0,air:.4}},water:{gains:{fire:0,water:1,earth:0,air:.1},pans:{fire:-.4,water:0,earth:-.3,air:.2},rates:{fire:0,water:1.8,earth:0,air:.3}},earth:{gains:{fire:0,water:.09,earth:1,air:.08},pans:{fire:-.4,water:.32,earth:0,air:-.2},rates:{fire:0,water:.25,earth:1.65,air:.2}},air:{gains:{fire:0,water:0,earth:0,air:1},pans:{fire:-.4,water:.4,earth:-.3,air:0},rates:{fire:0,water:0,earth:0,air:1.8}}};function xv(){let n=null,e=!1,t="all",i=null,a=null,r=.8,o=null,s=null,l=null;function c(v){const T=v.sampleRate,w=Math.floor(T*5),E=4096,C=v.createBuffer(2,w,T);for(let F=0;F<2;F++){const X=C.getChannelData(F);let q=0,B=0,K=0,H=0,se=0,ue=0,de=0;for(let _e=0;_e<w;_e++){const Re=Math.random()*2-1;q=.99886*q+Re*.0555179,B=.99332*B+Re*.0750759,K=.969*K+Re*.153852,H=.8665*H+Re*.3104856,se=.55*se+Re*.5329522,ue=-.7616*ue-Re*.016898,X[_e]=(q+B+K+H+se+ue+de+Re*.5362)*.11,de=Re*.115926}for(let _e=0;_e<E;_e++){const Re=_e/E,j=w-E+_e;X[j]=X[j]*(1-Re)+X[_e]*Re}}const y=v.createBuffer(2,w,T);for(let F=0;F<2;F++){const X=y.getChannelData(F);let q=0;for(let B=0;B<w;B++){const K=Math.random()*2-1;q=(q+.022*K)/1.022,X[B]=q*3.1}for(let B=0;B<E;B++){const K=B/E,H=w-E+B;X[H]=X[H]*(1-K)+X[B]*K}}const _=Math.floor(T*.25),P=v.createBuffer(1,_,T),I=P.getChannelData(0);for(let F=0;F<_;F++)I[F]=Math.random()*2-1;return{pinkBuffer:C,brownBuffer:y,burstBuffer:P}}function f(v){const T=v.sampleRate,E=Math.floor(T*1.35),C=v.createBuffer(2,E,T);for(let _=0;_<2;_++){const P=C.getChannelData(_);let I=0;for(let F=0;F<E;F++){const X=F/E,q=1-Math.exp(-F/(T*.012)),B=Math.pow(1-X,3.4)*q,K=(Math.random()*2-1)*B,H=.22+.48*(1-X);I+=H*(K-I),P[F]=I*.65}}const y=v.createConvolver();return y.buffer=C,y}function d(v,T,w=1,E=0){const C=v.createBufferSource();return C.buffer=T,C.loop=!0,C.playbackRate.value=w,C.start(0,E%T.duration),C}function h(v,T=0){if(typeof v.createStereoPanner=="function"){const w=v.createStereoPanner();return w.pan.value=Math.max(-1,Math.min(1,T)),w}return v.createGain()}function p(v,T,w,E=.35){v&&v.pan&&v.pan.setTargetAtTime(Math.max(-1,Math.min(1,T)),w,E)}function g(){if(n)return;const v=window.AudioContext||window.webkitAudioContext;if(!v)return;n=new v;const T=n.currentTime,w=n.createDynamicsCompressor();w.threshold.setValueAtTime(-15,T),w.knee.setValueAtTime(18,T),w.ratio.setValueAtTime(3.2,T),w.attack.setValueAtTime(.012,T),w.release.setValueAtTime(.22,T),o=n.createGain(),o.gain.setValueAtTime(0,T),w.connect(o),o.connect(n.destination);const E=f(n),C=n.createGain();C.gain.setValueAtTime(.28,T),E.connect(C),C.connect(w),s=c(n);const{pinkBuffer:y,brownBuffer:_}=s,P=yi[t]||yi.all,I=n.createGain();I.gain.setValueAtTime(P.gains.fire,T);const F=h(n,P.pans.fire);I.connect(F),F.connect(w);const X=n.createGain();X.gain.setValueAtTime(.16,T),F.connect(X),X.connect(E);const q=d(n,_,.94,.3),B=n.createBiquadFilter();B.type="lowpass",B.frequency.setValueAtTime(125,T),B.Q.setValueAtTime(.85,T);const K=n.createGain();K.gain.setValueAtTime(.38,T),q.connect(B),B.connect(K),K.connect(I);const H=d(n,y,.88,1.1),se=n.createBiquadFilter();se.type="bandpass",se.frequency.setValueAtTime(320,T),se.Q.setValueAtTime(.95,T);const ue=n.createGain();ue.gain.setValueAtTime(.13,T),H.connect(se),se.connect(ue),ue.connect(I);const de=n.createGain();de.gain.setValueAtTime(P.gains.water,T);const _e=h(n,P.pans.water);de.connect(_e),_e.connect(w);const Re=n.createGain();Re.gain.setValueAtTime(.22,T),_e.connect(Re),Re.connect(E);const j=d(n,y,1.02,.7),le=n.createBiquadFilter();le.type="lowpass",le.frequency.setValueAtTime(920,T),le.Q.setValueAtTime(.55,T);const Te=n.createGain();Te.gain.setValueAtTime(.13,T),j.connect(le),le.connect(Te),Te.connect(de);const fe=d(n,_,.9,2.2),we=n.createBiquadFilter();we.type="lowpass",we.frequency.setValueAtTime(155,T);const ve=n.createGain();ve.gain.setValueAtTime(.2,T),fe.connect(we),we.connect(ve),ve.connect(de);const qe=d(n,y,.95,1.9),Je=n.createBiquadFilter();Je.type="lowpass",Je.frequency.setValueAtTime(420,T),Je.Q.setValueAtTime(.9,T);const $e=n.createGain();$e.gain.setValueAtTime(.14,T);const Qe=h(n,-.58);qe.connect(Je),Je.connect($e),$e.connect(Qe),Qe.connect(de);const z=d(n,y,1.05,3.6),nt=n.createBiquadFilter();nt.type="lowpass",nt.frequency.setValueAtTime(380,T),nt.Q.setValueAtTime(.9,T);const be=n.createGain();be.gain.setValueAtTime(.14,T);const J=h(n,.58);z.connect(nt),nt.connect(be),be.connect(J),J.connect(de);const ce=n.createGain();ce.gain.setValueAtTime(P.gains.earth,T);const ge=h(n,P.pans.earth);ce.connect(ge),ge.connect(w);const pe=n.createGain();pe.gain.setValueAtTime(.32,T),ge.connect(pe),pe.connect(E);const R=d(n,y,1.12,.4),b=n.createBiquadFilter();b.type="bandpass",b.frequency.setValueAtTime(2650,T),b.Q.setValueAtTime(.95,T);const k=n.createGain();k.gain.setValueAtTime(.065,T);const Q=h(n,-.52);R.connect(b),b.connect(k),k.connect(Q),Q.connect(ce);const N=d(n,y,1.18,2.8),G=n.createBiquadFilter();G.type="bandpass",G.frequency.setValueAtTime(3100,T),G.Q.setValueAtTime(1.05,T);const te=n.createGain();te.gain.setValueAtTime(.065,T);const O=h(n,.52);N.connect(G),G.connect(te),te.connect(O),O.connect(ce);const he=d(n,y,.86,4.1),Ae=n.createBiquadFilter();Ae.type="bandpass",Ae.frequency.setValueAtTime(420,T),Ae.Q.setValueAtTime(.85,T);const ee=n.createGain();ee.gain.setValueAtTime(.075,T),he.connect(Ae),Ae.connect(ee),ee.connect(ce);const me=n.createGain();me.gain.setValueAtTime(P.gains.air,T);const Ce=h(n,P.pans.air);me.connect(Ce),Ce.connect(w);const Ie=n.createGain();Ie.gain.setValueAtTime(.28,T),Ce.connect(Ie),Ie.connect(E);const Me=d(n,_,.96,1.5),Ye=n.createBiquadFilter();Ye.type="lowpass",Ye.frequency.setValueAtTime(175,T);const ne=n.createGain();ne.gain.setValueAtTime(.22,T),Me.connect(Ye),Ye.connect(ne),ne.connect(me);const Se=d(n,y,1.04,3.1),L=n.createBiquadFilter();L.type="bandpass",L.frequency.setValueAtTime(460,T),L.Q.setValueAtTime(2.3,T);const ae=n.createBiquadFilter();ae.type="bandpass",ae.frequency.setValueAtTime(840,T),ae.Q.setValueAtTime(2.7,T);const V=n.createBiquadFilter();V.type="bandpass",V.frequency.setValueAtTime(2400,T),V.Q.setValueAtTime(1.1,T);const $=n.createGain();$.gain.setValueAtTime(.16,T);const oe=n.createGain();oe.gain.setValueAtTime(.045,T),Se.connect(L),Se.connect(ae),Se.connect(V),L.connect($),ae.connect($),V.connect(oe),$.connect(me),oe.connect(me),l={compressor:w,outdoorConvolver:E,fire:{bus:I,pan:F,lowpass:B,rumbleGain:K,draftFilter:se,draftGain:ue},water:{bus:de,pan:_e,fallsBodyFilter:le,fallsBodyGain:Te,poolRumbleGain:ve,surfFilterL:Je,surfGainL:$e,surfFilterR:nt,surfGainR:be},earth:{bus:ce,pan:ge,leafFilterL:b,leafGainL:k,leafFilterR:G,leafGainR:te,valleyAirGain:ee},air:{bus:me,pan:Ce,buffetFilter:Ye,buffetGain:ne,ridgeBandLow:L,ridgeBandHigh:ae,ridgeGain:$,spindriftGain:oe}}}function x(v,T=!1){if(!n||!l)return;const w=yi[v]||yi.all,E=n.currentTime,C=T?.04:.38;for(const y of["fire","water","earth","air"])l[y].bus.gain.setTargetAtTime(w.gains[y],E,C),p(l[y].pan,w.pans[y],E,C)}function m(v,T=1){if(!n||!l||!s)return;const w=Math.random()>.62?2:1;for(let E=0;E<w;E++){const C=v+E*(.014+Math.random()*.028),y=n.createBufferSource();y.buffer=s.burstBuffer,y.playbackRate.setValueAtTime(.85+Math.random()*1.5,C);const _=n.createBiquadFilter();_.type="bandpass",_.frequency.setValueAtTime(1600+Math.random()*3600,C),_.Q.setValueAtTime(2.2+Math.random()*3.4,C);const P=n.createGain(),I=.008+Math.random()*.018,F=(.09+Math.random()*.14)*T*(E===0?1:.55);P.gain.setValueAtTime(1e-4,C),P.gain.linearRampToValueAtTime(F,C+.0015),P.gain.exponentialRampToValueAtTime(1e-4,C+I),y.connect(_),_.connect(P),P.connect(l.fire.bus),y.start(C),y.stop(C+I+.01)}if(Math.random()<.16){const E=n.createBufferSource();E.buffer=s.burstBuffer,E.playbackRate.setValueAtTime(.45,v);const C=n.createBiquadFilter();C.type="bandpass",C.frequency.setValueAtTime(115+Math.random()*85,v),C.Q.setValueAtTime(1.8,v);const y=n.createGain();y.gain.setValueAtTime(1e-4,v),y.gain.linearRampToValueAtTime(.11*T,v+.025),y.gain.exponentialRampToValueAtTime(1e-4,v+.18),E.connect(C),C.connect(y),y.connect(l.fire.bus),E.start(v),E.stop(v+.2)}}function u(v,T=1){if(!n||!l||!s)return;const w=n.createBufferSource();w.buffer=s.burstBuffer,w.playbackRate.setValueAtTime(.9+Math.random()*.6,v);const E=n.createBiquadFilter();E.type="bandpass",E.frequency.setValueAtTime(850+Math.random()*1450,v),E.Q.setValueAtTime(1.6+Math.random()*1.8,v);const C=n.createGain(),y=.045+Math.random()*.075,_=(.042+Math.random()*.045)*T;C.gain.setValueAtTime(1e-4,v),C.gain.linearRampToValueAtTime(_,v+.008),C.gain.exponentialRampToValueAtTime(1e-4,v+y),w.connect(E),E.connect(C),C.connect(l.water.bus),w.start(v),w.stop(v+y+.015)}function M(v,T=1){if(!n||!l)return;const w=h(n,(Math.random()-.5)*1.3);w.connect(l.earth.bus),w.connect(l.outdoorConvolver);const E=Math.floor(Math.random()*4);if(E===0){const C=3050+Math.random()*550,y=C*(.81+Math.random()*.03),_=[{t:0,dur:.095,f0:C*.97,f1:C},{t:.135,dur:.16,f0:y*1.02,f1:y*.985}];for(const P of _){const I=v+P.t,F=n.createOscillator();F.type="sine",F.frequency.setValueAtTime(P.f0,I),F.frequency.exponentialRampToValueAtTime(P.f1,I+P.dur);const X=n.createGain();X.gain.setValueAtTime(1e-4,I),X.gain.linearRampToValueAtTime(.032*T,I+.014),X.gain.exponentialRampToValueAtTime(1e-4,I+P.dur),F.connect(X),X.connect(w),F.start(I),F.stop(I+P.dur+.01)}}else if(E===1){const C=2650+Math.random()*750,y=3+Math.floor(Math.random()*2);for(let _=0;_<y;_++){const P=v+_*.072,I=.052,F=n.createOscillator();F.type="sine",F.frequency.setValueAtTime(C*.92,P),F.frequency.exponentialRampToValueAtTime(C*(1.14+_*.03),P+I*.65),F.frequency.exponentialRampToValueAtTime(C*.98,P+I);const X=n.createGain();X.gain.setValueAtTime(1e-4,P),X.gain.linearRampToValueAtTime(.028*T,P+.009),X.gain.exponentialRampToValueAtTime(1e-4,P+I),F.connect(X),X.connect(w),F.start(P),F.stop(P+I+.01)}}else if(E===2){const C=2150+Math.random()*450,y=.14,_=n.createOscillator();_.type="sine",_.frequency.setValueAtTime(C,v),_.frequency.exponentialRampToValueAtTime(C*1.42,v+y*.78),_.frequency.exponentialRampToValueAtTime(C*1.28,v+y);const P=n.createGain();P.gain.setValueAtTime(1e-4,v),P.gain.linearRampToValueAtTime(.03*T,v+.016),P.gain.exponentialRampToValueAtTime(1e-4,v+y),_.connect(P),P.connect(w),_.start(v),_.stop(v+y+.01)}else{const C=3300+Math.random()*800,y=.058,_=n.createOscillator();_.type="sine",_.frequency.setValueAtTime(C*1.18,v),_.frequency.exponentialRampToValueAtTime(C*.84,v+y);const P=n.createGain();P.gain.setValueAtTime(1e-4,v),P.gain.linearRampToValueAtTime(.026*T,v+.006),P.gain.exponentialRampToValueAtTime(1e-4,v+y),_.connect(P),P.connect(w),_.start(v),_.stop(v+y+.01)}}function S(v){const T=v-Math.floor(v);if(T<.28){const E=T/.28;return E*E*(3-2*E)}const w=(T-.28)/.72;return Math.pow(1-w,1.85)}return{get enabled(){return e},toggle(){if(i&&(clearTimeout(i),i=null),e){if(e=!1,n&&o){const v=n.currentTime;o.gain.cancelScheduledValues(v),o.gain.setValueAtTime(o.gain.value,v),o.gain.setTargetAtTime(0,v,.1),i=setTimeout(()=>{!e&&n&&n.state==="running"&&n.suspend().catch(()=>{})},480)}}else if(e=!0,g(),n){n.state==="suspended"&&n.resume().catch(()=>{});const v=n.currentTime;x(t,!0),o.gain.cancelScheduledValues(v),o.gain.setValueAtTime(o.gain.value,v),o.gain.setTargetAtTime(gv,v,.14)}return e},setFocus(v){t=yi[v]?v:"all",e&&n&&x(t,!1)},triggerSurge(){if(!e||!n||!l||!s)return;n.state==="suspended"&&n.resume().catch(()=>{});const v=n.currentTime,T=d(n,s.brownBuffer,.78,Math.random()*3),w=n.createBiquadFilter();w.type="lowpass",w.Q.setValueAtTime(1.15,v),w.frequency.setValueAtTime(90,v),w.frequency.exponentialRampToValueAtTime(210,v+.48),w.frequency.exponentialRampToValueAtTime(65,v+3.5);const E=n.createGain(),C=t==="earth"?.22:.42;E.gain.setValueAtTime(1e-4,v),E.gain.linearRampToValueAtTime(C,v+.32),E.gain.exponentialRampToValueAtTime(1e-4,v+3.6),T.connect(w),w.connect(E),E.connect(l.compressor),E.connect(l.outdoorConvolver),T.stop(v+3.65);const y=d(n,s.pinkBuffer,1.05,Math.random()*3),_=n.createBiquadFilter();_.type=t==="earth"?"bandpass":"lowpass",_.Q.setValueAtTime(t==="air"?2:.85,v);const P=t==="earth"?950:280,I=t==="earth"?3400:1850;_.frequency.setValueAtTime(P,v),_.frequency.exponentialRampToValueAtTime(I,v+.55),_.frequency.exponentialRampToValueAtTime(P*1.1,v+3.5);const F=n.createGain();if(F.gain.setValueAtTime(1e-4,v),F.gain.linearRampToValueAtTime(.24,v+.42),F.gain.exponentialRampToValueAtTime(1e-4,v+3.55),y.connect(_),_.connect(F),F.connect(l.compressor),F.connect(l.outdoorConvolver),y.stop(v+3.6),t==="fire"||t==="all"||t==="sanctum")for(let X=0;X<6;X++)m(v+.08+X*.14+Math.random()*.06,1.25)},update(v,T=1,w=0){const E=a!==null&&v>=a?Math.min(v-a,.1):.016;if(a=v,!e||!n||!l||n.state!=="running")return;const C=Math.max(.2,Math.min(2.5,Number.isFinite(T)?T:1)),y=Math.max(0,Math.min(1.5,Number.isFinite(w)?w:0)),_=C*(.85+.65*y),P=n.currentTime,I=.5+.5*Math.sin(v*2.3)*Math.cos(v*3.7);l.fire.lowpass.frequency.setTargetAtTime(110+45*C+115*y,P,.08),l.fire.rumbleGain.gain.setTargetAtTime(.32+.11*C+.18*y,P,.08),l.fire.draftFilter.frequency.setTargetAtTime(280+95*I+180*y,P,.08),l.fire.draftGain.gain.setTargetAtTime(.1+.06*C+.11*y,P,.08);const F=S(v/7.8+.15),X=S(v/9.4+.62);l.water.surfFilterL.frequency.setTargetAtTime(220+1280*F+420*y,P,.1),l.water.surfGainL.gain.setTargetAtTime((.06+.16*F)*(.8+.3*C+.4*y),P,.1),l.water.surfFilterR.frequency.setTargetAtTime(210+1220*X+420*y,P,.1),l.water.surfGainR.gain.setTargetAtTime((.06+.15*X)*(.8+.3*C+.4*y),P,.1),l.water.fallsBodyFilter.frequency.setTargetAtTime(860+220*C+480*y,P,.1),l.water.fallsBodyGain.gain.setTargetAtTime(.11+.04*C+.08*y,P,.1);const q=.45+.55*(.5+.5*Math.sin(v*.48+Math.sin(v*.19))),B=.45+.55*(.5+.5*Math.sin(v*.41+1.4+Math.cos(v*.23))),K=(.75+.45*C)*(1+1.35*y);l.earth.leafGainL.gain.setTargetAtTime(.032+.068*q*K,P,.1),l.earth.leafGainR.gain.setTargetAtTime(.032+.068*B*K,P,.1),l.earth.leafFilterL.frequency.setTargetAtTime(2200+1100*q+700*y,P,.1),l.earth.leafFilterR.frequency.setTargetAtTime(2500+1150*B+700*y,P,.1);const H=.5+.5*(Math.sin(v*.37)*.6+Math.sin(v*.83+2.1)*.4);l.air.ridgeBandLow.frequency.setTargetAtTime(340+290*H+240*y,P,.1),l.air.ridgeBandHigh.frequency.setTargetAtTime(640+480*H+380*y,P,.1),l.air.ridgeGain.gain.setTargetAtTime((.1+.11*H)*(.8+.35*C+.75*y),P,.1),l.air.buffetGain.gain.setTargetAtTime((.14+.12*H)*(.8+.3*C+.65*y),P,.1),l.air.spindriftGain.gain.setTargetAtTime((.025+.045*H)*(.8+.4*C+.9*y),P,.1);const se=(yi[t]||yi.all).rates;if(se.fire>0&&Math.random()<E*6.4*se.fire*_&&m(P+Math.random()*.025,Math.min(1.5,.78+.32*_)),se.water>0&&Math.random()<E*2.8*se.water*_&&u(P+Math.random()*.03,Math.min(1.4,.8+.28*_)),se.earth>0&&v>=r){M(P+.02,Math.min(1.25,.85+.18*C));const ue=se.earth>1.2?1.5:2.8;r=v+ue+Math.random()*2.6}}}}const je=`
vec4 mod289_4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute4(vec4 x) { return mod289_4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt4(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// 3D Simplex Noise [-1, 1]
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289_3(i);
  vec4 p = permute4(permute4(permute4(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt4(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Domain-rotated 4-octave FBM in [-1, 1] approx
float fbm4(vec3 p) {
  float value = 0.0;
  float amp = 0.5;
  mat3 rot = mat3(
    0.00,  0.80,  0.60,
   -0.80,  0.36, -0.48,
   -0.60, -0.48,  0.64
  );
  for (int i = 0; i < 4; i++) {
    value += amp * snoise(p);
    p = rot * p * 2.03 + vec3(13.1, 7.7, 5.3);
    amp *= 0.5;
  }
  return value;
}

// Ridged multifractal turbulence [0, 1]
float ridgedFbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(snoise(p));
    n = n * n;
    sum += n * amp;
    p = p * 2.07 + vec3(4.2, -9.1, 6.8);
    amp *= 0.48;
  }
  return clamp(sum, 0.0, 1.2);
}

vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123);
}

// 2D Cellular / Voronoi returning vec2(F1, edgeDistance)
vec2 voronoi2D(vec2 x, float timeOffset) {
  vec2 n = floor(x);
  vec2 f = fract(x);

  vec2 mg = vec2(0.0);
  vec2 mr = vec2(0.0);
  float md = 8.0;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash22(n + g);
      o = 0.5 + 0.42 * sin(timeOffset + 6.2831853 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md) {
        md = d;
        mr = r;
        mg = g;
      }
    }
  }

  float mdEdge = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 o = hash22(n + g);
      o = 0.5 + 0.42 * sin(timeOffset + 6.2831853 * o);
      vec2 r = g + o - f;
      if (dot(mr - r, mr - r) > 0.00001) {
        mdEdge = min(mdEdge, dot(0.5 * (mr + r), normalize(r - mr)));
      }
    }
  }

  return vec2(sqrt(max(md, 0.0)), max(mdEdge, 0.0));
}

mat2 rot2D(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}
`;function An(n,e,t){const i=Math.max(0,Math.min(1,(t-n)/(e-n)));return i*i*(3-2*i)}function ta(n,e){const t=Math.sin(n*127.1+e*311.7)*43758.5453123;return t-Math.floor(t)}function rl(n,e){const t=Math.floor(n),i=Math.floor(e),a=n-t,r=e-i,o=a*a*(3-2*a),s=r*r*(3-2*r),l=ta(t,i),c=ta(t+1,i),f=ta(t,i+1),d=ta(t+1,i+1);return(l+(c-l)*o+(f-l)*s+(l-c-f+d)*o*s)*2-1}function Iu(n,e,t=4){let i=0,a=.5,r=1;for(let o=0;o<t;o++){i+=a*rl(n*r,e*r);const s=n*.8-e*.6+13.7,l=n*.6+e*.8+7.3;n=s,e=l,r*=2.02,a*=.5}return i}function Gr(n,e,t=4){let i=0,a=.52,r=1;for(let o=0;o<t;o++){const s=1-Math.abs(rl(n*r,e*r));i+=s*s*a;const l=n*.8-e*.6-5.1,c=n*.6+e*.8+9.4;n=l,e=c,r*=2.05,a*=.48}return i}function zn(n){return Math.sin(n*.125+.18)*1.85+Math.cos(n*.065-.65)*.85-.15}function Ji(n){const e=n+.6;return 1.12+Math.exp(-(e*e)/18)*.46+.18*Math.sin(n*.29+1.1)+.1*Math.cos(n*.57-.4)}function sn(n){return-.68-n*.016}function Ht(n,e){const t=zn(e),i=Ji(e),a=sn(e),r=Math.abs(n-t)-i,o=Math.hypot(n,e),s=-.52*(1-An(-i*.85,.05,r)),l=An(-.15,.68,r),c=Gr(n*.28+3.1,e*.28-1.9,3),f=Iu(n*.46,e*.46,3),d=l*(1.14+c*.72+f*.24),h=Gr(n*.115,e*.115,4),p=Math.sin(h*7.5)*.08,g=.54+.46*An(10.5,22,o),m=An(1.05,11.8,r)*g*(1.85+h*5.2+p),u=An(23.5,58,o)*(1-An(78,96,o)*.32),M=Gr(n*.04+4.2,e*.04-2.7,4),S=.62+.48*Math.sin(Math.atan2(e,n)*3+1.2),v=u*(2.6+M*11.4*S);return{y:a+s+d+m+v,dRiver:r,surfY:a,cx:t,hw:i}}const rn=`
vec3 safeNormalize3(vec3 v) {
  float lenSq = dot(v, v);
  return lenSq > 1e-8 ? v * inversesqrt(lenSq) : vec3(0.0, 1.0, 0.0);
}

vec2 safeNormalize2(vec2 v) {
  float lenSq = dot(v, v);
  return lenSq > 1e-8 ? v * inversesqrt(lenSq) : vec2(0.0, 1.0);
}

float atan2Safe(float y, float x) {
  float sx = (abs(x) < 1e-6 && abs(y) < 1e-6) ? 1e-6 : x;
  return atan(y, sx);
}

float riverCenterXGLSL(float z) {
  return sin(z * 0.125 + 0.18) * 1.85 + cos(z * 0.065 - 0.65) * 0.85 - 0.15;
}

float riverHalfWidthGLSL(float z) {
  float dz = z + 0.6;
  float cauldronBell = exp(-(dz * dz) / 18.0);
  return 1.12 + cauldronBell * 0.46 + 0.18 * sin(z * 0.29 + 1.1) + 0.10 * cos(z * 0.57 - 0.4);
}

// Fast 2-octave & 3-octave FBM & Ridged helpers for locked 60 FPS Ultra passes
float fbm2Fast(vec3 p) {
  float v = 0.62 * snoise(p);
  p = vec3(0.80 * p.y + 0.60 * p.z, -0.80 * p.x + 0.36 * p.y - 0.48 * p.z, -0.60 * p.x - 0.48 * p.y + 0.64 * p.z) * 2.04 + vec3(13.1, 7.7, 5.3);
  v += 0.38 * snoise(p);
  return v;
}

float ridged2Fast(vec3 p) {
  float n0 = 1.0 - abs(snoise(p));
  p = p * 2.08 + vec3(4.2, -9.1, 6.8);
  float n1 = 1.0 - abs(snoise(p));
  return clamp(n0 * n0 * 0.64 + n1 * n1 * 0.36, 0.0, 1.15);
}

float fbm3Fast(vec3 p) {
  float value = 0.0;
  float amp = 0.5;
  mat3 rot = mat3(
    0.00,  0.80,  0.60,
   -0.80,  0.36, -0.48,
   -0.60, -0.48,  0.64
  );
  for (int i = 0; i < 3; i++) {
    value += amp * snoise(p);
    p = rot * p * 2.03 + vec3(13.1, 7.7, 5.3);
    amp *= 0.5;
  }
  return value;
}

float ridged3Fast(vec3 p) {
  float sum = 0.0;
  float amp = 0.56;
  for (int i = 0; i < 3; i++) {
    float n = 1.0 - abs(snoise(p));
    n = n * n;
    sum += n * amp;
    p = p * 2.06 + vec3(4.2, -9.1, 6.8);
    amp *= 0.48;
  }
  return clamp(sum, 0.0, 1.2);
}

// Shared outdoor smoky volcanic dusk sky & horizon scatter (strictly <= 0.88 linear so sky never blooms!)
vec3 evalSmokyDuskAtmosphere(vec3 dir, float uTime, float uSurge) {
  vec3 d = safeNormalize3(dir);
  float elev = clamp(d.y, -0.15, 1.0);

  vec3 sunDir = safeNormalize3(vec3(-0.52, 0.065, -0.85));
  float sunCos = clamp(dot(d, sunDir), 0.0, 1.0);

  vec3 zenithCol   = vec3(0.024, 0.036, 0.080);
  vec3 midSkyCol   = vec3(0.105, 0.060, 0.080);
  vec3 horizonCol  = vec3(0.40,  0.135, 0.050);
  vec3 calderaGlow = vec3(0.68,  0.24,  0.062);

  float hLow = 1.0 - smoothstep(-0.04, 0.25, elev);
  float hMid = 1.0 - smoothstep(0.05, 0.70, elev);

  vec3 sky = mix(zenithCol, midSkyCol, hMid);
  sky = mix(sky, horizonCol, pow(max(hLow, 1e-5), 1.35));

  // Mie forward dusk scatter toward low volcanic sunset + caldera horizon glow
  float mieBand = pow(max(sunCos, 1e-5), 5.5) * (1.0 - smoothstep(0.0, 0.42, max(elev, 0.0)));
  float mieCore = pow(max(sunCos, 1e-5), 36.0) * (1.0 - smoothstep(0.0, 0.18, max(elev, 0.0)));
  sky += calderaGlow * (mieBand * 0.52 + mieCore * 0.34);

  // Subtle warm canyon lava bounce in lower haze
  sky += vec3(0.20, 0.052, 0.012) * (1.0 - smoothstep(-0.08, 0.16, elev)) * (0.45 + 0.45 * uSurge);
  return clamp(sky, vec3(0.0), vec3(0.88));
}

// Fast convective rotational curl displacement for buoyant flames
vec3 convectiveCurl(vec3 p, float t) {
  vec3 q = p + vec3(0.0, -t, 0.0);
  float eps = 0.24;
  float nx0 = snoise(q);
  float ny0 = snoise(q + vec3(11.3, 4.7, 8.9));
  float dNxDy = (snoise(q + vec3(0.0, eps, 0.0)) - nx0) / eps;
  float dNxDz = (snoise(q + vec3(0.0, 0.0, eps)) - nx0) / eps;
  float dNyDx = (snoise(q + vec3(eps, 0.0, 0.0) + vec3(11.3, 4.7, 8.9)) - ny0) / eps;
  return vec3(dNxDy * 0.55, (dNxDz - dNyDx) * 0.25, -dNxDz * 0.55 + dNyDx * 0.35);
}

// Rich, saturated blackbody wildfire ramp (crimson -> vermilion -> molten gold-amber, never clipped ivory-white!)
vec3 naturalBlackbodyFire(float temp, float h) {
  vec3 darkSoot   = vec3(0.024, 0.009, 0.007);
  vec3 deepRuby   = vec3(0.46,  0.020, 0.002);
  vec3 vermilion  = vec3(0.92,  0.155, 0.007);
  vec3 moltenGold = vec3(1.08,  0.44,  0.032);
  vec3 brightGold = vec3(1.20,  0.70,  0.14);

  vec3 col = mix(darkSoot, deepRuby, smoothstep(0.04, 0.26, temp));
  col = mix(col, vermilion, smoothstep(0.24, 0.56, temp));
  col = mix(col, moltenGold, smoothstep(0.54, 0.86, temp));
  col = mix(col, brightGold, smoothstep(0.88, 1.18, temp) * 0.65);
  // Soft exponential roll-off preserves rich orange-gold saturation right down to the logs & fissure vents
  return vec3(1.0) - exp(-col * 1.18);
}
`;function _v(n){const e=n.attributes.position,t=new Map,i=[],a=[];for(let o=0;o<e.count;o++){const s=e.getX(o),l=e.getY(o),c=e.getZ(o),f=`${Math.round(s*1e4)},${Math.round(l*1e4)},${Math.round(c*1e4)}`;let d=t.get(f);d===void 0&&(d=i.length/3,i.push(s,l,c),t.set(f,d)),a.push(d)}const r=new st;return r.setAttribute("position",new ct(i,3)),r.setIndex(a),r}function yv(n){let e=0;const t=n.map(({geo:l,matType:c,lavaRefY:f})=>{l.attributes.normal||l.computeVertexNormals();const d=l.index?l.toNonIndexed():l.clone(),h=d.attributes.position.count;return e+=h,{geo:d,matType:c,lavaRefY:f,count:h}}),i=new Float32Array(e*3),a=new Float32Array(e*3),r=new Float32Array(e*2);let o=0;for(const{geo:l,matType:c,lavaRefY:f,count:d}of t){i.set(l.attributes.position.array,o*3),a.set(l.attributes.normal.array,o*3);for(let h=0;h<d;h++)r[(o+h)*2+0]=c,r[(o+h)*2+1]=f;o+=d,l.dispose()}const s=new st;return s.setAttribute("position",new De(i,3)),s.setAttribute("normal",new De(a,3)),s.setAttribute("aPropMeta",new De(r,2)),s.computeBoundingSphere(),s}function Mv(n,e,t,i){const a=new io(1,4),r=_v(a);a.dispose();const o=r.attributes.position,s=[];for(let c=0;c<6;c++){const f=ta(i*13.1+c,c*7.7)*Math.PI*2,d=(ta(c*5.3,i*19.3+c)-.3)*1.25;s.push(new D(Math.cos(f)*Math.cos(d),Math.sin(d),Math.sin(f)*Math.cos(d)).normalize())}const l=new D;for(let c=0;c<o.count;c++){l.fromBufferAttribute(o,c);const f=Gr(l.x*1.65+i,l.z*1.65-i+l.y*.9,3),d=Iu(l.x*3.4-i*.7,l.y*3.4+l.z*2.1,3);let h=.76+f*.28+d*.08;for(let p=0;p<s.length;p++){const g=l.dot(s[p]),x=An(.5,.98,g);h*=1-x*.28}l.multiplyScalar(h),l.y<-.35&&(l.y=-.35+(l.y+.35)*.45),l.multiply(e),o.setXYZ(c,l.x,l.y,l.z)}return r.rotateY(t),r.translate(n.x,n.y,n.z),r.computeVertexNormals(),r}function br(n,e,t,i,a,r){const c=new Float32Array(882),f=[],d=new D().subVectors(e,n).normalize(),h=Math.abs(d.y)>.9?new D(1,0,0):new D(0,1,0),p=new D().crossVectors(d,h).normalize(),g=new D().crossVectors(p,d).normalize(),x=new D;let m=0;for(let M=0;M<=20;M++){const S=M/20,v=Math.sin(S*Math.PI);x.lerpVectors(n,e,S),x.addScaledVector(a,v);const T=t+(i-t)*S;for(let w=0;w<14;w++){const C=w/14*Math.PI*2,y=1+.15*Math.sin(C*6+S*5+r*4)+.09*rl(Math.cos(C)*2.5+r,S*6.5),_=S>.88?1-(S-.88)/.12*(.45+.45*Math.sin(C*4+r)):1,P=Math.max(.015,T*y*_),I=p.x*Math.cos(C)+g.x*Math.sin(C),F=p.y*Math.cos(C)+g.y*Math.sin(C),X=p.z*Math.cos(C)+g.z*Math.sin(C);c[m]=x.x+I*P,c[m+1]=x.y+F*P,c[m+2]=x.z+X*P,m+=3}}for(let M=0;M<20;M++)for(let S=0;S<14;S++){const v=(S+1)%14,T=M*14+S,w=M*14+v,E=(M+1)*14+S,C=(M+1)*14+v;f.push(T,w,E,w,C,E)}const u=new st;return u.setAttribute("position",new De(c,3)),u.setIndex(f),u.computeVertexNormals(),u}function Sv(n=null){const e=new Ka;e.background=new lt(1444880),e.fog=new no(1838608,.0135);const t={uTime:{value:0},uIntensity:{value:1},uSurge:{value:0},uPixelRatio:{value:Math.min((typeof window<"u"?window.devicePixelRatio:1)||1,2)},uViewportScale:{value:1},uWindVec:{value:new Le(.26,.09)},uDraftStrength:{value:0},uPointerXZ:{value:new Le(999,999)},uPointerInfluence:{value:0},uFlicker:{value:1}},i=new ao(5202570,2757130,.85);e.add(i);const a=new ro(16747085,.92);a.position.set(-18,7.5,-26),e.add(a);const r=new xc(16739098,5.8,24,1.65);r.position.set(.35,1.25,-.35),e.add(r);const o=new xc(16733458,2.8,13,1.75);o.position.set(1.85,1.15,-.25),e.add(o);const s=new Ke({uniforms:t,side:Lt,depthWrite:!1,vertexShader:`
      varying vec3 vWorldDir;
      void main() {
        vWorldDir = position;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      uniform float uTime;
      uniform float uSurge;
      uniform float uFlicker;
      varying vec3 vWorldDir;

      void main() {
        vec3 dir = safeNormalize3(vWorldDir);
        vec3 col = evalSmokyDuskAtmosphere(dir, uTime, uSurge);

        // Faint twilight stars emerging near the deep indigo zenith
        if (dir.y > 0.22) {
          vec2 starCell = floor(dir.xz / max(dir.y + 0.15, 0.2) * 95.0);
          vec2 h = hash22(starCell);
          vec2 gridUv = fract(dir.xz / max(dir.y + 0.15, 0.2) * 95.0) - 0.5;
          float dStar = length(gridUv - (h - 0.5) * 0.65);
          float twinkle = 0.65 + 0.35 * sin(uTime * 2.4 + h.x * 45.0);
          float star = smoothstep(0.055, 0.008, dStar) * step(0.955, h.y) * smoothstep(0.24, 0.65, dir.y);
          col += vec3(0.55, 0.64, 0.85) * star * twinkle * 0.45;
        }

        // Drifting smoky volcanic stratocumulus & ash cloud decks (fast 2-octave FBM)
        if (dir.y > 0.015) {
          vec2 skyPlane = dir.xz / (dir.y + 0.16);
          vec2 windDrift = vec2(uTime * 0.025, uTime * 0.011);

          float c1 = fbm2Fast(vec3(skyPlane * 0.55 - windDrift, uTime * 0.015)) * 0.5 + 0.5;
          float c2 = snoise(vec3(skyPlane * 1.25 - windDrift * 1.45 + 5.7, uTime * 0.02)) * 0.5 + 0.5;
          float cloudDensity = smoothstep(0.44, 0.80, c1 * 0.68 + c2 * 0.38);
          float horizonFade = smoothstep(0.015, 0.18, dir.y) * (1.0 - smoothstep(0.62, 0.95, dir.y) * 0.55);
          cloudDensity *= horizonFade;

          float bellyWarmth = smoothstep(0.68, 0.34, c2) * (1.0 - smoothstep(0.04, 0.48, dir.y));
          vec3 cloudTop   = vec3(0.036, 0.034, 0.050);
          vec3 cloudBelly = vec3(0.50, 0.160, 0.050) * (0.85 + 0.25 * uFlicker + 0.35 * uSurge);
          vec3 cloudCol = mix(cloudTop, cloudBelly, clamp(bellyWarmth * 0.95 + 0.12, 0.0, 1.0));

          col = mix(col, cloudCol, cloudDensity * 0.78);
        }

        gl_FragColor = vec4(clamp(col, vec3(0.0), vec3(0.92)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),l=new ut(new ya(128,36,24),s);l.frustumCulled=!1,l.renderOrder=1,e.add(l);function c(){const L=new en(54,54,176,176);L.rotateX(-Math.PI/2);const ae=L.attributes.position,V=new Float32Array(ae.count*2);for(let $=0;$<ae.count;$++){const oe=ae.getX($),re=ae.getZ($),ye=Ht(oe,re);ae.setY($,ye.y),V[$*2+0]=ye.dRiver,V[$*2+1]=ye.surfY}return L.setAttribute("aChannel",new De(V,2)),L.computeVertexNormals(),L}function f(){const oe=new Float32Array(17415),re=new Float32Array(5805*2),ye=[];let We=0,Ne=0;for(let Ge=0;Ge<=44;Ge++){const Ze=Ge/44,rt=25.5+(96-25.5)*Math.pow(Ze,1.15),dt=(1-An(25.5,25.5+2.2,rt))*-.35;for(let Ue=0;Ue<=128;Ue++){const ft=Ue/128*Math.PI*2,ie=Math.cos(ft)*rt,He=Math.sin(ft)*rt,ze=Ht(ie,He);oe[We]=ie,oe[We+1]=ze.y+dt,oe[We+2]=He,We+=3,re[Ne]=ze.dRiver,re[Ne+1]=ze.surfY,Ne+=2}}for(let Ge=0;Ge<44;Ge++)for(let Ze=0;Ze<128;Ze++){const rt=Ge*129+Ze,dt=rt+1,Ue=(Ge+1)*129+Ze,ft=Ue+1;ye.push(rt,dt,Ue,dt,ft,Ue)}const Ee=new st;return Ee.setAttribute("position",new De(oe,3)),Ee.setAttribute("aChannel",new De(re,2)),Ee.setIndex(ye),Ee.computeVertexNormals(),Ee}const d=new Ke({uniforms:t,vertexShader:`
      attribute vec2 aChannel;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vChannel;

      void main() {
        vWorldPos = position;
        vWorldNormal = normal;
        vChannel = aChannel;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uFlicker;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vChannel;

      float sampleRockRelief(vec3 pos) {
        float r = 1.0 - abs(snoise(pos * 0.52));
        return r * r * 0.68 + (snoise(pos * 1.32) * 0.5 + 0.5) * 0.32;
      }

      void main() {
        vec3 p = vWorldPos;
        // Analytical per-pixel shoreline distance eliminates grid-triangle sawtooth teeth along the lava channel!
        float riverNearestX = riverCenterXGLSL(p.z);
        float dRiver = abs(p.x - riverNearestX) - riverHalfWidthGLSL(p.z);
        float lavaSurfY = vChannel.y;
        float camDist = length(p - cameraPosition);

        // Low-frequency 3D chiseled volcanic basalt strata & cliff ledges (ALU-tuned for locked 60 FPS)
        float detailFade = 1.0 - smoothstep(10.5, 25.0, camDist);
        float macroN = snoise(p * 0.42);
        float strata = sin(p.y * 3.8 + macroN * 2.8) * 0.5 + 0.5;
        float rockMacro = macroN * 0.5 + 0.5;

        vec3 geomN = safeNormalize3(vWorldNormal);
        vec3 N = geomN;
        float rockCrevice = rockMacro;
        if (detailFade > 0.01) {
          float eps = 0.085;
          float h0 = sampleRockRelief(p);
          float hx = sampleRockRelief(p + vec3(eps, 0.0, 0.0));
          float hy = sampleRockRelief(p + vec3(0.0, eps, 0.0));
          float hz = sampleRockRelief(p + vec3(0.0, 0.0, eps));
          vec3 grad = vec3(hx - h0, hy - h0, hz - h0) / eps;
          rockCrevice = h0;
          N = safeNormalize3(geomN - grad * (0.14 * detailFade));
        }

        vec3 V = safeNormalize3(cameraPosition - p);

        // Dark weathered volcanic basalt (#1a1716 to #2d2624)
        vec3 darkBasalt      = vec3(0.014, 0.0115, 0.0110);
        vec3 weatheredBasalt = vec3(0.035, 0.0255, 0.0235);
        vec3 obsidianEdge    = vec3(0.010, 0.0090, 0.0105);

        float weatherMix = smoothstep(0.20, 0.80, rockMacro * 0.65 + rockCrevice * 0.35) * (0.55 + 0.45 * strata);
        vec3 albedo = mix(darkBasalt, weatheredBasalt, weatherMix);

        float shoreProximity = 1.0 - smoothstep(-0.06, 0.72, dRiver);
        albedo = mix(albedo, obsidianEdge, shoreProximity * 0.55);

        // 1) Low smoky dusk directional light + twilight sky hemisphere fill
        vec3 sunDir = safeNormalize3(vec3(-0.52, 0.24, -0.82));
        float ndlSun = max(dot(N, sunDir), 0.0);
        vec3 skyFill = mix(vec3(0.045, 0.032, 0.034), vec3(0.145, 0.145, 0.205), N.y * 0.5 + 0.5);

        // 2) Warm molten lava illumination cast UP onto the steep inner basalt trench walls!
        vec3 toRiver = vec3(riverNearestX - p.x, (lavaSurfY + 0.12) - p.y, 0.0);
        float riverDist = length(toRiver);
        vec3 riverDir = safeNormalize3(toRiver + vec3(0.0, -0.10, 0.0));
        float trenchWallMask = 1.0 - smoothstep(0.35, 2.45, dRiver);
        float riverAtten = (1.0 / (1.0 + riverDist * riverDist * 0.35)) * trenchWallMask;
        float ndlRiver = max(dot(N, riverDir), 0.0) * 0.85 + 0.15 * shoreProximity;
        vec3 H_river = safeNormalize3(riverDir + V);
        float specShore = pow(max(dot(N, H_river), 1e-5), 28.0) * shoreProximity * 0.25;
        vec3 riverLight = vec3(0.92, 0.25, 0.024) * (ndlRiver * 0.14 + specShore * 0.12) * riverAtten * (0.75 + 0.50 * uSurge) * (1.0 - smoothstep(22.0, 38.0, abs(p.z)));

        // 3) Central roaring wildfire & recessed fissure warm rim/bounce radiance
        vec3 pyrePos = vec3(0.35, 0.95, -0.30);
        vec3 toPyre = pyrePos - p;
        float pyreDist = length(toPyre);
        vec3 pyreDir = safeNormalize3(toPyre);
        float pyreAtten = 1.0 / (1.0 + pyreDist * pyreDist * 0.075);
        float ndlPyre = pow(max(dot(N, pyreDir), 1e-5), 1.25);
        vec3 H_pyre = safeNormalize3(pyreDir + V);
        float specPyre = pow(max(dot(N, H_pyre), 1e-5), 26.0) * (0.12 + 0.28 * shoreProximity);
        float pyrePower = (1.05 + 0.40 * uIntensity + 0.85 * uSurge) * uFlicker * pyreAtten;
        vec3 pyreLight = vec3(0.96, 0.32, 0.038) * (ndlPyre * 0.11 + specPyre * 0.08) * pyrePower;

        vec3 col = albedo * (skyFill * 3.8 + vec3(0.95, 0.52, 0.28) * ndlSun * 1.45)
                 + riverLight
                 + pyreLight;

        // Tight organic FBM-modulated glowing magma contact lip right at the recessed shoreline (< 14cm)
        if (dRiver > -0.14 && dRiver < 0.14) {
          float contactNoise = fbm3Fast(vec3(p.x * 3.4, p.z * 3.4 - uTime * 0.22, uTime * 0.16)) * 0.5 + 0.5;
          float rimGlow = (1.0 - smoothstep(-0.03, 0.12, dRiver)) * smoothstep(0.34, 0.80, contactNoise);
          col += vec3(0.92, 0.22, 0.014) * rimGlow * (0.65 + 0.40 * uSurge);
        }

        // Subtle distant caldera lava vein glimmer on far mountain flank
        if (camDist > 38.0) {
          float farVein = smoothstep(0.87, 0.96, ridged3Fast(p * 0.12 + vec3(0.0, uTime * 0.02, 0.0))) *
                          smoothstep(4.5, 10.5, p.y) *
                          smoothstep(-12.0, -48.0, p.z);
          col += vec3(0.72, 0.17, 0.02) * farVein * 0.34;
        }

        // Seamless directional smoky dusk aerial perspective
        vec3 viewRay = p - cameraPosition;
        vec3 horizonFogCol = evalSmokyDuskAtmosphere(vec3(viewRay.x, max(viewRay.y * 0.25, 0.02), viewRay.z), uTime, uSurge);
        float fogAmt = 1.0 - exp(-pow(max(camDist * 0.0142, 1e-5), 1.85));
        col = mix(col, horizonFogCol, clamp(fogAmt, 0.0, 0.94));

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),h=new ut(c(),d);e.add(h);const p=new ut(f(),d);e.add(p);const g=[],x=[[6.6,-1,.72,.96,.64,.86,.4,1.1],[6.1,1,.78,.9,.58,.8,1.7,2.3],[4.4,-1,.68,.86,.56,.78,2.6,3.7],[3.9,1,.7,1.04,.7,.92,.9,4.9],[1.8,-1,.66,.8,.54,.74,2.1,5.5],[1.5,1,.75,1.1,.76,.94,1.2,6.8],[-.9,-1,.72,.94,.66,.84,3,7.4],[-2.6,-1,.68,.88,.6,.8,.5,8.9],[-2.9,1,.74,1.08,.76,.94,1.9,9.6],[-5.4,-1,1.55,1.62,1.22,1.42,.8,10.2],[-6.2,1,1.65,1.78,1.32,1.54,2.4,11.4],[.8,-1,2.15,1.48,1.12,1.32,1.5,12.8],[-1.4,1,2.35,1.64,1.26,1.44,2.9,13.5],[-7.5,-1,.76,.84,.56,.74,.3,14.1],[-8.8,1,.8,.94,.64,.82,1.6,15.7],[5.2,-1,2.05,1.24,.84,1.08,2.2,16.3],[4.9,1,2.2,1.3,.88,1.12,.7,17.9]];for(const[ne,Se,L,ae,V,$,oe,re]of x){const ye=zn(ne),We=Ji(ne),Ne=ye+Se*(We+L+ae*.42),Ee=Ht(Ne,ne),Ge=Ht(Ne-Se*ae*.42,ne),Ze=Math.min(Ee.y,Ge.y),rt=Mv(new D(Ne,Ze+V*.24,ne),new D(ae,V,$),oe,re);g.push({geo:rt,matType:0,lavaRefY:Ee.surfY})}const m=zn(-.2)+Ji(-.2)+.52,u=Ht(m+1.45,-.55).y,M=Ht(m,.18).y;g.push({geo:br(new D(m+1.45,u+.08,-.55),new D(m-.18,M+.14,.18),.16,.085,new D(0,.1,.08),2.1),matType:1,lavaRefY:sn(0)}),g.push({geo:br(new D(m+1.15,Ht(m+1.15,.65).y+.08,.65),new D(m+.05,Ht(m+.05,-.75).y+.28,-.75),.14,.07,new D(-.06,.12,0),5.4),matType:1,lavaRefY:sn(-.2)}),g.push({geo:br(new D(m+.35,Ht(m+.35,-.18).y+.12,-.18),new D(m+.05,Ht(m+.35,-.18).y+.96,-.44),.085,.028,new D(.05,.04,-.05),8.7),matType:1,lavaRefY:sn(-.2)});const S=zn(-.35)-Ji(-.35)-.5,v=Ht(S-1.15,.25).y;g.push({geo:br(new D(S-1.15,v+.08,.25),new D(S+.15,Ht(S+.15,-.65).y+.16,-.65),.135,.065,new D(.04,.08,-.04),11.9),matType:1,lavaRefY:sn(-.35)});const T=yv(g),w=new Ke({uniforms:t,vertexShader:`
      attribute vec2 aPropMeta;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vPropMeta;

      void main() {
        vWorldPos = position;
        vWorldNormal = normal;
        vPropMeta = aPropMeta;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uDraftStrength;
      uniform float uFlicker;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vPropMeta;

      // Low-frequency chiseled volcanic basalt relief (2-tap ALU-tuned, zero high-frequency leopard speckle!)
      float boulderMacroField(vec3 q) {
        float r = 1.0 - abs(snoise(q * 0.62));
        return r * r * 0.66 + (snoise(q * 1.38) * 0.5 + 0.5) * 0.34;
      }

      void main() {
        vec3 p = vWorldPos;
        float matType = vPropMeta.x;
        float lavaRefY = vPropMeta.y;
        vec3 geomN = safeNormalize3(vWorldNormal);
        vec3 V = safeNormalize3(cameraPosition - p);
        float camDist = length(p - cameraPosition);

        float b0 = boulderMacroField(p);
        vec3 N = geomN;
        if (camDist < 19.0) {
          float eps = 0.085;
          float bx = boulderMacroField(p + vec3(eps, 0.0, 0.0));
          float by = boulderMacroField(p + vec3(0.0, eps, 0.0));
          float bz = boulderMacroField(p + vec3(0.0, 0.0, eps));
          vec3 grad = vec3(bx - b0, by - b0, bz - b0) / eps;
          N = safeNormalize3(geomN - grad * (matType < 0.5 ? 0.11 : 0.18));
        }

        vec3 sunDir = safeNormalize3(vec3(-0.52, 0.24, -0.82));
        float ndlSun = max(dot(N, sunDir), 0.0);
        vec3 skyFill = mix(vec3(0.048, 0.034, 0.036), vec3(0.155, 0.155, 0.215), N.y * 0.5 + 0.5);

        // Warm central wildfire & fissure direction
        vec3 pyrePos = vec3(0.35, 0.95, -0.30);
        vec3 pyreDir = safeNormalize3(pyrePos - p);
        float pyreDist = length(pyrePos - p);
        float pyreAtten = 1.0 / (1.0 + pyreDist * pyreDist * 0.085);
        float ndlPyre = max(dot(N, pyreDir), 0.0);
        vec3 H = safeNormalize3(pyreDir + V);

        // Subtle warm orange lava rim-lighting from the recessed canyon trench below
        float nearestRiverX = riverCenterXGLSL(p.z);
        vec3 toLava = vec3(nearestRiverX - p.x, (lavaRefY + 0.10) - p.y, 0.0);
        float lavaDist = length(toLava);
        vec3 lavaDir = safeNormalize3(toLava);
        float riverFacing = pow(max(dot(N, lavaDir), 1e-5), 1.35);
        float heightFade = 1.0 - smoothstep(0.2, 2.8, p.y - lavaRefY);
        float lavaRimAmt = riverFacing * heightFade / (1.0 + lavaDist * lavaDist * 0.28);
        vec3 lavaRimGlow = vec3(0.92, 0.25, 0.022) * lavaRimAmt * (0.65 + 0.55 * uSurge) * uFlicker;

        vec3 col;
        if (matType < 0.5) {
          // Dark weathered volcanic basalt (#1a1716 to #2d2624) with broad natural weathering & subtle orange fissure rim
          float weather = fbm3Fast(p * 0.46) * 0.5 + 0.5;
          float creviceAo = smoothstep(0.16, 0.78, b0);
          vec3 basaltDark      = vec3(0.014, 0.0115, 0.0110); // #1a1716
          vec3 basaltWeathered = vec3(0.035, 0.0255, 0.0235); // #2d2624
          vec3 rockCol = mix(basaltDark, basaltWeathered, weather * (0.55 + 0.45 * creviceAo));

          float fresnel = pow(max(1.0 - max(dot(N, V), 0.0), 1e-5), 2.8);
          float fissureRimMask = pow(max(ndlPyre, 1e-5), 1.35) * 0.55 + fresnel * smoothstep(-0.10, 0.65, dot(N, pyreDir)) * 0.65;
          float spec = pow(max(dot(N, H), 1e-5), 28.0) * 0.06;

          col = rockCol * (skyFill * 3.9 + vec3(0.95, 0.52, 0.28) * ndlSun * 1.45)
              + vec3(0.95, 0.30, 0.032) * (fissureRimMask * 0.14 + spec) * pyreAtten * uFlicker * (1.0 + 0.65 * uSurge)
              + lavaRimGlow * 0.24
              + vec3(0.055, 0.058, 0.082) * fresnel * 0.18;
        } else {
          // Gnarled charred wildfire timber with smouldering ember bark cracks
          vec3 charBark = mix(vec3(0.014, 0.011, 0.012), vec3(0.038, 0.029, 0.027), smoothstep(0.15, 0.85, b0));
          col = charBark * (skyFill * 3.4 + vec3(0.88, 0.46, 0.22) * ndlSun * 1.15)
              + vec3(0.92, 0.29, 0.035) * ndlPyre * 0.12 * pyreAtten * uFlicker
              + lavaRimGlow * 0.20;

          float emberNoise = ridged3Fast(p * 5.8 + vec3(0.0, -uTime * 0.22, 0.0));
          float smoulder = smoothstep(0.70, 0.96, emberNoise) *
                           (0.65 + 0.35 * sin(uTime * 4.2 + p.x * 6.5) + 0.40 * uDraftStrength + 0.50 * uSurge);
          vec3 emberCol = mix(vec3(0.66, 0.048, 0.004), vec3(1.04, 0.44, 0.045), smoothstep(0.35, 0.95, smoulder));
          col += emberCol * clamp(smoulder, 0.0, 0.95);
        }

        vec3 viewRay = p - cameraPosition;
        vec3 horizonFogCol = evalSmokyDuskAtmosphere(vec3(viewRay.x, max(viewRay.y * 0.25, 0.02), viewRay.z), uTime, uSurge);
        float fogAmt = 1.0 - exp(-pow(max(camDist * 0.0142, 1e-5), 1.85));
        col = mix(col, horizonFogCol, clamp(fogAmt, 0.0, 0.92));

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),E=new ut(T,w);e.add(E);function C(){const oe=new Float32Array(27183),re=new Float32Array(9061*2),ye=[];let We=0,Ne=0;for(let Ge=0;Ge<=220;Ge++){const Ze=Ge/220,rt=-26+52*Ze,dt=zn(rt),Ue=Ji(rt)+.22,ft=sn(rt);for(let ie=0;ie<=40;ie++){const He=ie/40,ze=(He-.5)*2,Oe=dt+ze*Ue;oe[We]=Oe,oe[We+1]=ft,oe[We+2]=rt,We+=3,re[Ne]=He,re[Ne+1]=Ze*15,Ne+=2}}for(let Ge=0;Ge<220;Ge++)for(let Ze=0;Ze<40;Ze++){const rt=Ge*41+Ze,dt=rt+1,Ue=(Ge+1)*41+Ze,ft=Ue+1;ye.push(rt,Ue,dt,dt,Ue,ft)}const Ee=new st;return Ee.setAttribute("position",new De(oe,3)),Ee.setAttribute("uv",new De(re,2)),Ee.setIndex(ye),Ee}const y=new Ke({uniforms:t,vertexShader:`
      ${je}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying float vCauldronMask;

      void main() {
        vUv = uv;
        vec3 p = position;
        float cross = (uv.x - 0.5) * 2.0;
        float absCross = abs(cross);
        float centerMask = 1.0 - smoothstep(0.42, 0.94, absCross);
        float edgeTuck = -0.055 * smoothstep(0.70, 1.0, absCross);

        float dz = p.z + 0.5;
        float cauldron = exp(-(dz * dz) / 11.0);
        vCauldronMask = cauldron;

        float viscousSwell = snoise(vec3(p.x * 1.2, p.z * 0.85 - uTime * 0.60, uTime * 0.30)) * 0.032;
        float boilWave = snoise(vec3(p.x * 2.4, p.z * 2.4 - uTime * 1.6, uTime * 1.1)) * 0.048 * cauldron;
        float surgeFlood = uSurge * 0.075 * centerMask;

        p.y += (viscousSwell + boilWave * (0.8 + 0.85 * uSurge) + surgeFlood) * centerMask + edgeTuck;
        vWorldPos = p;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec2 uPointerXZ;
      uniform float uPointerInfluence;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying float vCauldronMask;

      // World-proportioned domain-warped organic pahoehoe crust slabs + viscous shear veins (ALU-tuned)
      vec4 sampleLavaCrustState(vec2 baseCoord, vec2 flowOffset, float timeAnim) {
        vec2 q = baseCoord + flowOffset;
        vec2 warpMacro = vec2(
          fbm2Fast(vec3(q * 1.05, timeAnim * 0.15)),
          fbm2Fast(vec3(q * 1.05 + 6.7, timeAnim * 0.15))
        ) * 0.94;
        vec2 warpFine = vec2(
          snoise(vec3(q * 2.8, timeAnim * 0.26)),
          snoise(vec3(q * 2.8 + 4.3, timeAnim * 0.26))
        ) * 0.28;

        vec2 warped = q * 1.55 + warpMacro + warpFine;
        vec2 vorPlate = voronoi2D(warped, timeAnim * 0.18);
        float shearVein = ridged2Fast(vec3(warped * 1.35, timeAnim * 0.14));
        float rope = sin(q.y * 8.5 + warpMacro.y * 7.5 + q.x * 2.2) * 0.5 + 0.5;
        return vec4(vorPlate.y, shearVein, rope, warpMacro.x);
      }

      void main() {
        vec3 p = vWorldPos;
        float cross = (vUv.x - 0.5) * 2.0;
        float absCross = abs(cross);

        // Poiseuille laminar velocity profile: faster down center, chilled drag along steep basalt walls
        float speedProfile = 1.0 - 0.68 * cross * cross;
        float flowRate = 0.12 + 0.045 * uIntensity + 0.075 * uSurge;

        float cycle = uTime * flowRate;
        float ph0 = fract(cycle);
        float ph1 = fract(cycle + 0.5);
        float blend = abs(2.0 * ph0 - 1.0);

        // True 1:1 world-scale coordinates so crust plates never stretch vertically in foreground!
        float localX = p.x - riverCenterXGLSL(p.z);
        vec2 baseCoord = vec2(localX * 0.72, p.z * 0.68);
        vec2 dirFlow = vec2(0.0, -2.2 * speedProfile);

        vec4 s0 = sampleLavaCrustState(baseCoord, dirFlow * ph0, uTime);
        vec4 s1 = sampleLavaCrustState(baseCoord + vec2(3.7, 5.1), dirFlow * ph1, uTime + 11.0);

        float edgeMajor = mix(s0.x, s1.x, blend);
        float shearVein = mix(s0.y, s1.y, blend);
        float ropeWrinkle = mix(s0.z, s1.z, blend);
        float widthMod = clamp(0.55 + 0.65 * mix(s0.w, s1.w, blend), 0.2, 1.3);

        // Pointer proximity locally fractures pahoehoe crust
        float ptrDist = length(p.xz - uPointerXZ);
        float ptrHeat = exp(-ptrDist * ptrDist * 0.32) * uPointerInfluence * 0.52;

        // Active fissure vents fracture pahoehoe plates without washing out to a solid yellow pool
        float openVent = vCauldronMask * (0.32 + 0.30 * uSurge) * (1.0 - absCross * 0.68);
        float bankChill = smoothstep(0.58, 0.94, absCross);

        float crackWidth = (0.088 + 0.055 * uSurge + openVent * 0.22 + ptrHeat * 0.14) * widthMod * (1.0 - bankChill * 0.72);
        float majorCrack = 1.0 - smoothstep(0.008, max(crackWidth, 0.016), edgeMajor);
        float veinGlow = smoothstep(0.68, 0.96, shearVein) * (0.34 + 0.42 * openVent) * (1.0 - bankChill);

        float moltenHeat = clamp(
          majorCrack * 0.92 +
          veinGlow +
          openVent * 0.48 +
          ptrHeat +
          uSurge * 0.14 -
          bankChill * 0.48,
          0.0,
          1.25
        );

        vec3 V = safeNormalize3(cameraPosition - p);
        vec3 ropeN = safeNormalize3(vec3((ropeWrinkle - 0.5) * 0.28, 1.0, (0.5 - ropeWrinkle) * 0.32));
        float fresnel = pow(max(1.0 - max(dot(ropeN, V), 0.0), 1e-5), 4.0);
        vec3 blackCrust = vec3(0.014, 0.012, 0.015) + vec3(0.032, 0.022, 0.024) * ropeWrinkle * 0.50
                        + vec3(0.09, 0.04, 0.025) * fresnel;

        vec3 cherrySlag  = vec3(0.48, 0.024, 0.002);
        vec3 magmaOrange = vec3(0.94, 0.19,  0.008);
        vec3 moltenGold  = vec3(1.18, 0.60,  0.10);

        vec3 lavaRaw = mix(blackCrust, cherrySlag, smoothstep(0.10, 0.40, moltenHeat));
        lavaRaw = mix(lavaRaw, magmaOrange, smoothstep(0.38, 0.76, moltenHeat));
        lavaRaw = mix(lavaRaw, moltenGold, smoothstep(0.78, 1.18, moltenHeat));
        vec3 col = mix(blackCrust, vec3(1.0) - exp(-lavaRaw * 1.16), smoothstep(0.04, 0.22, moltenHeat));

        float camDist = length(p - cameraPosition);
        vec3 viewRay = p - cameraPosition;
        vec3 horizonFogCol = evalSmokyDuskAtmosphere(vec3(viewRay.x, max(viewRay.y * 0.25, 0.02), viewRay.z), uTime, uSurge);
        float fogAmt = 1.0 - exp(-pow(max(camDist * 0.0142, 1e-5), 1.85));
        col = mix(col, horizonFogCol, clamp(fogAmt, 0.0, 0.92));

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),_=new ut(C(),y);e.add(_);function P(ne,Se,L,ae=0){const oe=[];let re=0;for(const dt of ne){const Ue=[],ft=dt.r*Se,ie=dt.h*L;for(let et=0;et<=44;et++){const Mt=et/44,pt=(1-An(0,.22,Mt))*.46,Pt=Math.sin(Math.pow(Mt,.6)*Math.PI)*.68,Ut=1-Math.pow(Mt,1.22)*.88,zt=Math.max(.016,(Pt+pt)*Ut)*ft;Ue.push(new Le(zt,Mt*ie))}const He=new el(Ue,32),ze=He.index?He.toNonIndexed():He;He.dispose();const Oe=ze.attributes.position.count;re+=Oe,oe.push({geo:ze,c:dt,cnt:Oe})}const ye=new Float32Array(re*3),We=new Float32Array(re*3),Ne=new Float32Array(re*2),Ee=new Float32Array(re*3),Ge=new Float32Array(re*3);let Ze=0;for(const{geo:dt,c:Ue,cnt:ft}of oe){ye.set(dt.attributes.position.array,Ze*3),We.set(dt.attributes.normal.array,Ze*3),Ne.set(dt.attributes.uv.array,Ze*2);for(let ie=0;ie<ft;ie++)Ee[(Ze+ie)*3+0]=Ue.x,Ee[(Ze+ie)*3+1]=Ue.y+ae,Ee[(Ze+ie)*3+2]=Ue.z,Ge[(Ze+ie)*3+0]=Ue.speed,Ge[(Ze+ie)*3+1]=Ue.scale,Ge[(Ze+ie)*3+2]=Ue.seed;Ze+=ft,dt.dispose()}const rt=new st;return rt.setAttribute("position",new De(ye,3)),rt.setAttribute("normal",new De(We,3)),rt.setAttribute("uv",new De(Ne,2)),rt.setAttribute("aClusterOrigin",new De(Ee,3)),rt.setAttribute("aPlumeParams",new De(Ge,3)),rt}function I({opacity:ne,additive:Se,side:L,contrast:ae,seedShift:V=0}){return new Ke({uniforms:{...t,uOpacity:{value:ne},uContrast:{value:ae},uSeedShift:{value:V},uIsAdditive:{value:Se?1:0}},transparent:!0,depthWrite:!1,side:L,blending:Se?Pi:Yt,vertexShader:`
        ${je}
        ${rn}
        attribute vec3 aClusterOrigin;
        attribute vec3 aPlumeParams;
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        uniform vec2 uWindVec;
        uniform float uDraftStrength;
        uniform float uSeedShift;

        varying vec2 vUv;
        varying vec3 vLocalSample;
        varying vec3 vPlumeParams;
        varying vec3 vNormalView;
        varying vec3 vViewDir;

        void main() {
          vUv = uv;
          vPlumeParams = vec3(aPlumeParams.xy, aPlumeParams.z + uSeedShift);
          float speed = aPlumeParams.x;
          float scale = aPlumeParams.y;
          float seed  = aPlumeParams.z + uSeedShift;

          float h = clamp(uv.y, 0.0, 1.0);
          float t = uTime * speed * (0.86 + 0.28 * uIntensity + 0.42 * uSurge + 0.20 * uDraftStrength);

          vec3 p = position;
          p.y *= (0.94 + 0.16 * uIntensity + 0.50 * uSurge);

          vec3 nCoord = vec3(p.x * scale, p.y * (scale * 0.48), p.z * scale) + seed;
          vec3 curl = convectiveCurl(nCoord * 0.74, t * 0.72);
          float khRoll = snoise(nCoord * 1.48 + vec3(4.2, -t * 1.38, 7.1));

          // Sweeping Rayleigh-Taylor billowing & sinuous flickering whip right from the lower base
          float buoyAmp = (0.06 + pow(max(h, 1e-5), 0.82) * 0.94) * (0.42 + 0.22 * uSurge + 0.18 * uDraftStrength);
          p.x += (curl.x * 0.85 + khRoll * 0.34) * buoyAmp;
          p.z += (curl.z * 0.85 - khRoll * 0.34) * buoyAmp;
          p.y += curl.y * 0.18 * h;
          p.xz *= 1.0 + khRoll * 0.24 * (0.18 + h);

          // Natural outdoor dusk wind + cursor gust aerodynamic lean
          float windBend = pow(max(h, 1e-5), 1.32);
          p.xz += uWindVec * windBend * p.y * 0.32;

          vLocalSample = p;
          vec3 worldPos = aClusterOrigin + p;
          vec4 mvPos = modelViewMatrix * vec4(worldPos, 1.0);
          vNormalView = safeNormalize3(normalMatrix * normal);
          vViewDir = safeNormalize3(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,fragmentShader:`
        ${je}
        ${rn}
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSurge;
        uniform float uDraftStrength;
        uniform float uOpacity;
        uniform float uContrast;
        uniform float uIsAdditive;

        varying vec2 vUv;
        varying vec3 vLocalSample;
        varying vec3 vPlumeParams;
        varying vec3 vNormalView;
        varying vec3 vViewDir;

        void main() {
          float h = clamp(vUv.y, 0.0, 1.0);
          if (h < 0.008 || h > 0.97) discard;

          float speed = vPlumeParams.x;
          float scale = vPlumeParams.y;
          float seed  = vPlumeParams.z;

          float t = uTime * speed * (0.88 + 0.30 * uIntensity + 0.44 * uSurge + 0.22 * uDraftStrength);

          float buoyY = pow(max(vLocalSample.y * 0.25, 1e-4), 0.82) * 3.45;
          vec3 baseCoord = vec3(
            vLocalSample.x * (scale * 1.12),
            buoyY * (scale * 0.64) - t * 1.42,
            vLocalSample.z * (scale * 1.12)
          ) + seed;

          float wx = snoise(baseCoord * 0.72 + vec3(2.9, 0.0, 6.4));
          float wz = snoise(baseCoord * 0.72 + vec3(5.1, 7.8, 3.2));
          vec3 rtWarp = vec3(wx, (wx - wz) * 0.35, wz) * (0.36 + 0.20 * h + 0.14 * uDraftStrength);

          vec3 q = baseCoord + rtWarp;
          float fbmVal = fbm2Fast(q) * 0.5 + 0.5;
          float ridge = ridged2Fast(q * 1.36);

          float rawField = clamp(fbmVal * 0.44 + ridge * 0.68, 0.0, 1.25);
          float flameField = pow(max(rawField, 1e-5), uContrast);

          float fresnel = abs(dot(safeNormalize3(vNormalView), safeNormalize3(vViewDir)));
          float edgeSoft = pow(max(fresnel, 1e-5), 1.05);

          // Structured flame-tongue roots right down to h = 0.02 (never a flat white-out bulb!)
          float rootTongues = 0.18 + 0.82 * smoothstep(0.16, 0.88, ridge * 0.70 + fbmVal * 0.38);
          float coreHold = (1.0 - smoothstep(0.04, 0.44, h)) * pow(max(fresnel, 1e-5), 1.35) * 0.28 * rootTongues;
          float baseFade = smoothstep(0.0, 0.07, h);
          float tipPinch = pow(max(h, 1e-5), 1.18) * 0.78;
          float density = clamp((flameField + coreHold - tipPinch * 0.74) * 1.78, 0.0, 1.0) * baseFade;
          density *= 1.0 - smoothstep(0.84, 1.0, h);
          density *= mix(0.08, 1.0, edgeSoft);

          if (density < 0.015) discard;

          float temp = clamp(
            pow(max(density, 1e-5), 1.08) * (0.94 - h * 0.46) +
            ridge * 0.16 * (1.0 - h * 0.5) +
            uSurge * 0.12,
            0.0,
            1.14
          );

          vec3 col = naturalBlackbodyFire(temp, h);
          // Suppress additive stacking near the base so lower flames stay saturated orange-gold!
          float addBaseGuard = mix(1.0, smoothstep(0.08, 0.44, h), uIsAdditive);
          float alpha = clamp(density * uOpacity * addBaseGuard, 0.0, 0.84);
          gl_FragColor = vec4(col * (0.72 + 0.28 * density), alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `})}const F=zn(-.3),X=zn(-1.75)+.22,q=zn(1.05)-.24,B=m+.16,K=S-.12,H=[{x:F,y:sn(-.3)-.04,z:-.3,r:.96,h:4.35,speed:2.35,scale:1.24,seed:1.7},{x:X,y:sn(-1.75)-.04,z:-1.75,r:.7,h:3.35,speed:2.6,scale:1.38,seed:8.4},{x:q,y:sn(1.05)-.04,z:1.05,r:.66,h:2.95,speed:2.5,scale:1.42,seed:15.9},{x:B,y:Ht(B,-.15).y+.08,z:-.15,r:.58,h:3.05,speed:2.75,scale:1.52,seed:23.2},{x:K,y:Ht(K,-.45).y+.06,z:-.45,r:.46,h:2.35,speed:2.85,scale:1.66,seed:35.6}],se=P(H,1,1,0),ue=new ut(se,I({opacity:.42,additive:!1,side:Lt,contrast:1.52,seedShift:0}));ue.frustumCulled=!1,ue.renderOrder=4,e.add(ue);const de=new ut(se,I({opacity:.76,additive:!1,side:Xn,contrast:1.56,seedShift:0}));de.frustumCulled=!1,de.renderOrder=5,e.add(de);const _e=P(H,1.2,1.14,-.02),Re=new ut(_e,I({opacity:.19,additive:!0,side:Bt,contrast:1.84,seedShift:13.7}));Re.frustumCulled=!1,Re.renderOrder=7,e.add(Re);const j=new Ke({uniforms:t,transparent:!0,depthWrite:!1,side:Bt,blending:Pi,vertexShader:`
      ${je}
      ${rn}
      attribute vec4 aCurtainSpec;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec2 uWindVec;
      uniform float uDraftStrength;

      varying vec2 vUv;
      varying float vSeed;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vSeed = aCurtainSpec.x;
        float h = clamp(uv.y, 0.0, 1.0);
        float t = uTime * (2.5 + 0.42 * uIntensity + 0.35 * uDraftStrength) + vSeed * 9.0;

        vec3 p = position;
        float reach = aCurtainSpec.y * (0.95 + 0.16 * uIntensity + 0.62 * uSurge);
        p.y = p.y + h * reach;

        float waveX = snoise(vec3(uv.x * 1.8, h * 2.2 - t * 0.80, vSeed * 7.1));
        float waveZ = snoise(vec3(uv.x * 1.8 + 4.7, h * 2.2 - t * 0.80, vSeed * 7.1));
        float flutter = pow(max(h, 1e-5), 0.92) * (0.34 + 0.18 * uSurge + 0.16 * uDraftStrength);
        p.x += waveX * flutter;
        p.z += waveZ * flutter;

        p.xz += uWindVec * pow(max(h, 1e-5), 1.32) * reach * 0.32;

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vNormalView = safeNormalize3(normalMatrix * normal);
        vViewDir = safeNormalize3(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      uniform float uTime;
      uniform float uSurge;
      varying vec2 vUv;
      varying float vSeed;
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        float h = clamp(vUv.y, 0.0, 1.0);
        float sideEnv = pow(max(sin(clamp(vUv.x, 0.0, 1.0) * 3.14159265), 1e-5), 0.88);

        float buoyY = pow(max(h, 1e-4), 0.82);
        vec3 q = vec3(vUv.x * 2.6, buoyY * 3.8 - uTime * 3.1, vSeed * 11.3);
        float warp = snoise(q * 0.80) * 0.38;
        float ridge = ridged3Fast(q + warp);
        float tongues = pow(max(ridge, 1e-5), 1.62);

        // Suppress additive curtain near base (h < 0.25) so base never clips white!
        float vertEnv = smoothstep(0.06, 0.34, h) * (1.0 - smoothstep(0.62, 1.0, h));
        float grazingFade = pow(max(abs(dot(safeNormalize3(vNormalView), safeNormalize3(vViewDir))), 1e-5), 1.15);

        float alpha = sideEnv * vertEnv * grazingFade * smoothstep(0.24, 0.86, tongues) * (0.19 + 0.15 * uSurge);
        if (alpha < 0.01) discard;

        float temp = clamp((1.0 - h) * 0.58 + tongues * 0.42 + uSurge * 0.12, 0.0, 1.08);
        vec3 col = naturalBlackbodyFire(temp, h);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `});{const ne=[{x:F,y:sn(-.3),z:-.3,w:2.35,h:4.15,rotY:.22,seed:.13},{x:F,y:sn(-.3),z:-.3,w:2.05,h:3.95,rotY:1.78,seed:.37},{x:q,y:sn(1.05),z:1.05,w:1.65,h:2.95,rotY:-.65,seed:.61},{x:B,y:Ht(B,-.15).y+.1,z:-.15,w:1.38,h:2.85,rotY:-.42,seed:.83},{x:B,y:Ht(B,-.15).y+.1,z:-.15,w:1.22,h:2.65,rotY:1.12,seed:.97}],Se=[];let L=0;for(const Ne of ne){const Ee=new en(Ne.w,.02,16,36),Ge=Ee.index?Ee.toNonIndexed():Ee;Ge.translate(0,.01,0),Ge.rotateY(Ne.rotY),Ge.translate(Ne.x,Ne.y,Ne.z);const Ze=Ge.attributes.position.count;L+=Ze,Se.push({geo:Ge,spec:[Ne.seed,Ne.h,Ne.w,0],count:Ze})}const ae=new Float32Array(L*3),V=new Float32Array(L*3),$=new Float32Array(L*2),oe=new Float32Array(L*4);let re=0;for(const Ne of Se){ae.set(Ne.geo.attributes.position.array,re*3),V.set(Ne.geo.attributes.normal.array,re*3),$.set(Ne.geo.attributes.uv.array,re*2);for(let Ee=0;Ee<Ne.count;Ee++)oe[(re+Ee)*4+0]=Ne.spec[0],oe[(re+Ee)*4+1]=Ne.spec[1],oe[(re+Ee)*4+2]=Ne.spec[2],oe[(re+Ee)*4+3]=Ne.spec[3];re+=Ne.count,Ne.geo.dispose()}const ye=new st;ye.setAttribute("position",new De(ae,3)),ye.setAttribute("normal",new De(V,3)),ye.setAttribute("uv",new De($,2)),ye.setAttribute("aCurtainSpec",new De(oe,4));const We=new ut(ye,j);We.frustumCulled=!1,We.renderOrder=8,e.add(We)}const le=170,Te=new st,fe=new Float32Array(le*3),we=new Float32Array(le*4);for(let ne=0;ne<le;ne++){const Se=H[ne%H.length],L=Math.random()*Se.r*.46,ae=Math.random()*Math.PI*2;fe[ne*3+0]=Se.x+Math.cos(ae)*L,fe[ne*3+1]=Se.y+Se.h*(.44+Math.random()*.2),fe[ne*3+2]=Se.z+Math.sin(ae)*L,we[ne*4+0]=(ne/le+Math.random()*.04)%1,we[ne*4+1]=Math.random()*Math.PI*2,we[ne*4+2]=.072+Math.random()*.05,we[ne*4+3]=56+Math.random()*42}Te.setAttribute("position",new De(fe,3)),Te.setAttribute("aData",new De(we,4));const ve=new Ke({uniforms:t,transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
      ${je}
      attribute vec4 aData;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uPixelRatio;
      uniform float uViewportScale;
      uniform vec2 uWindVec;

      varying float vLife;
      varying float vSeed;
      varying float vWorldY;

      void main() {
        float phase = aData.x;
        vSeed = phase;
        float rate = aData.z * (0.82 + 0.26 * uIntensity + 0.32 * uSurge);
        float life = fract(phase + uTime * rate);
        vLife = life;

        // Cohesive convective smoke column (stays unified inside the visible sky frame!)
        float riseH = pow(max(life, 1e-5), 0.90) * (6.2 + 1.8 * uSurge);
        float spread = 0.22 + pow(max(life, 1e-5), 1.02) * 1.32;
        float swirlAng = aData.y + life * 1.85 + uTime * 0.14;

        vec3 turb = vec3(
          snoise(vec3(life * 1.8, uTime * 0.26, phase * 19.0)),
          snoise(vec3(life * 1.8 + 4.1, uTime * 0.26, phase * 19.0)) * 0.26,
          snoise(vec3(life * 1.8 + 8.7, uTime * 0.26, phase * 19.0))
        ) * spread;

        vec3 p = position;
        p.y += riseH + turb.y;
        p.x += cos(swirlAng) * spread * 0.32 + turb.x * 0.34;
        p.z += sin(swirlAng) * spread * 0.32 + turb.z * 0.34;
        p.xz += uWindVec * pow(max(life, 1e-5), 1.18) * 3.6;

        vWorldY = p.y;
        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        float billowGrow = 0.90 + life * 1.95;
        // Graceful fullscreen gl_PointSize cap when uViewportScale > 0.75 for locked 60 FPS Ultra!
        float maxSmokePx = mix(88.0, 148.0, step(0.75, uViewportScale)) * min(uPixelRatio, 1.6);
        gl_PointSize = clamp(aData.w * uPixelRatio * uViewportScale * billowGrow * (8.2 / max(-mvPos.z, 1.8)), 6.0, maxSmokePx);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      uniform float uTime;
      uniform float uSurge;
      uniform float uFlicker;

      varying float vLife;
      varying float vSeed;
      varying float vWorldY;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.46) discard;

        vec2 rotUv = rot2D(vSeed * 6.2831 + vLife * 0.85) * uv;
        // Fast single-tap 3D noise (3x faster per fragment, indistinguishable on soft Gaussian billows)
        float wisp = snoise(vec3(rotUv * 2.0, vSeed * 13.0 + uTime * 0.14)) * 0.5 + 0.5;

        // Ultra-soft Gaussian radial feathering (strictly 0 before d = 0.45; zero polka-dots, zero corners!)
        float radial = exp(-d * d * 11.8) * (1.0 - smoothstep(0.16, 0.45, d));
        float puff = radial * mix(0.76, 1.06, smoothstep(0.18, 0.82, wisp));

        // Warm ember-lit orange underbelly near the flames transitioning into smoky twilight charcoal aloft
        float nearFire = 1.0 - smoothstep(0.8, 5.6, vWorldY);
        float bellyMask = smoothstep(-0.22, 0.40, uv.y) * nearFire;

        vec3 fireUnderlight = vec3(0.86, 0.26, 0.040) * (0.88 + 0.24 * uFlicker + 0.50 * uSurge);
        vec3 charcoalPlume  = vec3(0.048, 0.036, 0.044);
        vec3 twilightHaze   = vec3(0.145, 0.082, 0.070);

        vec3 smokeBase = mix(charcoalPlume, twilightHaze, smoothstep(0.28, 0.94, vLife) * (0.75 - uv.y * 0.25));
        vec3 col = mix(smokeBase, fireUnderlight, clamp(bellyMask * 0.90, 0.0, 0.92));

        // Balanced per-puff alpha for 170 stratified billows (~97.5% less overdraw, identical velvety column!)
        float alpha = puff *
                      smoothstep(0.0, 0.16, vLife) *
                      (1.0 - smoothstep(0.55, 1.0, vLife)) *
                      0.155;
        if (alpha < 0.003) discard;

        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),qe=new Vn(Te,ve);qe.frustumCulled=!1,qe.renderOrder=3,e.add(qe);const Je=2630,$e=new st,Qe=new Float32Array(Je*3),z=new Float32Array(Je*4);for(let ne=0;ne<Je;ne++){if(ne<Je*.82){const Se=H[ne%H.length],L=Math.pow(Math.random(),.65)*Se.r*1.12,ae=Math.random()*Math.PI*2;Qe[ne*3+0]=Se.x+Math.cos(ae)*L,Qe[ne*3+1]=Se.y+.15+Math.random()*.65,Qe[ne*3+2]=Se.z+Math.sin(ae)*L}else{const Se=(Math.random()-.5)*18,L=zn(Se),ae=Ji(Se)*.82;Qe[ne*3+0]=L+(Math.random()*2-1)*ae,Qe[ne*3+1]=sn(Se)+.06,Qe[ne*3+2]=Se}z[ne*4+0]=Math.random(),z[ne*4+1]=Math.random()*50,z[ne*4+2]=.22+Math.random()*.36,z[ne*4+3]=2.4+Math.pow(Math.random(),2.2)*4.2}$e.setAttribute("position",new De(Qe,3)),$e.setAttribute("aData",new De(z,4));const nt=new Ke({uniforms:t,transparent:!0,depthWrite:!1,blending:Pi,vertexShader:`
      ${je}
      ${rn}
      attribute vec4 aData;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uPixelRatio;
      uniform float uViewportScale;
      uniform vec2 uWindVec;
      uniform float uDraftStrength;

      varying float vLife;
      varying float vFlicker;
      varying vec2 vScreenDir;
      varying float vStretch;

      vec3 evalSparkTrajectory(vec3 origin, float life, float seed, float speed) {
        float rise = pow(max(life, 1e-5), 0.88) * (6.4 + speed * 5.6 + 3.6 * uSurge);
        vec3 p = origin;
        p.y += rise;

        float gustScale = (0.45 + 1.65 * life) * (1.0 + 0.55 * uDraftStrength);
        p.x += snoise(vec3(life * 3.8, uTime * 0.95, seed)) * gustScale;
        p.z += snoise(vec3(life * 3.8 + 6.7, uTime * 0.95, seed)) * gustScale;
        p.y += snoise(vec3(life * 4.5 + 12.1, uTime * 1.15, seed)) * 0.38 * life;

        p.xz += uWindVec * pow(max(life, 1e-5), 1.22) * (6.4 + speed * 4.6);
        return p;
      }

      void main() {
        float phase = aData.x;
        float seed = aData.y;
        float speed = aData.z * (0.85 + 0.35 * uIntensity + 0.55 * uSurge + 0.25 * uDraftStrength);
        float life = fract(phase + uTime * speed * 0.42);
        vLife = life;

        vec3 p = evalSparkTrajectory(position, life, seed, speed);
        vec3 pNext = evalSparkTrajectory(position, min(life + 0.016, 1.0), seed, speed);

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vec4 mvNext = modelViewMatrix * vec4(pNext, 1.0);
        vec4 clipPos = projectionMatrix * mvPos;
        vec4 clipNext = projectionMatrix * mvNext;

        vec2 ndc0 = clipPos.xy / max(abs(clipPos.w), 1e-4);
        vec2 ndc1 = clipNext.xy / max(abs(clipNext.w), 1e-4);
        vec2 delta = ndc1 - ndc0;
        vScreenDir = safeNormalize2(vec2(delta.x, -delta.y));
        vStretch = clamp(length(delta) * 46.0, 0.35, 1.75);

        vFlicker = 0.55 + 0.45 * sin(uTime * 24.0 + seed * 17.0);

        float sizeEnv = sin(clamp(life, 0.0, 1.0) * 3.14159265);
        gl_PointSize = clamp(aData.w * uPixelRatio * uViewportScale * (0.55 + 0.75 * sizeEnv) * (9.5 / max(-mvPos.z, 1.0)), 1.5, 28.0);
        gl_Position = clipPos;
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      varying float vLife;
      varying float vFlicker;
      varying vec2 vScreenDir;
      varying float vStretch;

      void main() {
        vec2 centered = gl_PointCoord - 0.5;
        float rClip = length(centered);
        if (rClip > 0.48) discard;

        vec2 dir = safeNormalize2(vScreenDir);
        vec2 perp = vec2(-dir.y, dir.x);

        float along = dot(centered, dir) / (1.0 + vStretch * 0.42);
        float across = dot(centered, perp) * (2.35 + vStretch * 1.25);
        float d = length(vec2(along, across));
        if (d > 0.48) discard;

        float rimEnv = 1.0 - smoothstep(0.32, 0.47, rClip);
        float core = exp(-d * d * 40.0);
        float halo = exp(-d * d * 12.0) * 0.34;
        float glow = (core + halo) * rimEnv * vFlicker;

        vec3 hotGold    = vec3(1.32, 0.96, 0.46);
        vec3 warmOrange = vec3(1.02, 0.34, 0.022);
        vec3 cherryRed  = vec3(0.62, 0.038, 0.004);

        vec3 col = mix(hotGold, warmOrange, smoothstep(0.04, 0.38, vLife));
        col = mix(col, cherryRed, smoothstep(0.38, 0.88, vLife));

        float fade = smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.72, 1.0, vLife));
        float alphaFactor = clamp(glow * fade, 0.0, 1.0);
        if (alphaFactor < 0.01) discard;
        gl_FragColor = vec4(col * 0.88, alphaFactor);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),be=new Vn($e,nt);be.frustumCulled=!1,be.renderOrder=10,e.add(be);const J=600,ce=new st,ge=new Float32Array(J*3),pe=new Float32Array(J*4),R=new Float32Array(J*2);for(let ne=0;ne<J;ne++){const Se=ne%3,L=H[Se],ae=Math.random()*L.r*.55,V=Math.random()*Math.PI*2;ge[ne*3+0]=L.x+Math.cos(V)*ae,ge[ne*3+1]=L.y+.08,ge[ne*3+2]=L.z+Math.sin(V)*ae;const $=Math.random()*Math.PI*2,oe=.35+Math.random()*1.45;pe[ne*4+0]=Math.cos($)*oe,pe[ne*4+1]=3.4+Math.random()*4,pe[ne*4+2]=Math.sin($)*oe,pe[ne*4+3]=Math.random(),R[ne*2+0]=4+Math.pow(Math.random(),1.6)*5.6,R[ne*2+1]=Math.random()*Math.PI*2}ce.setAttribute("position",new De(ge,3)),ce.setAttribute("aVel",new De(pe,4)),ce.setAttribute("aMeta",new De(R,2));const b=new Ke({uniforms:t,transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
      attribute vec4 aVel;
      attribute vec2 aMeta;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uPixelRatio;
      uniform float uViewportScale;
      uniform vec2 uWindVec;

      varying float vLife;
      varying float vSpin;

      void main() {
        float phase = aVel.w;
        float life = fract(phase + uTime * 0.58);
        vLife = life;

        float fountainBoost = 0.44 + 0.22 * uIntensity + 1.42 * uSurge;
        float tSec = life * (1.25 + 0.55 * uSurge);
        float vy = aVel.y * fountainBoost;
        float gravity = 9.81;

        vec3 p = position;
        p.x += aVel.x * (0.55 + 0.75 * uSurge) * tSec + uWindVec.x * tSec * 0.45;
        p.z += aVel.z * (0.55 + 0.75 * uSurge) * tSec + uWindVec.y * tSec * 0.45;
        p.y += max(-0.15, vy * tSec - 0.5 * gravity * tSec * tSec);

        vSpin = uTime * 4.5 + aMeta.y;

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        float abovePool = step(position.y - 0.08, p.y);
        float surgeScale = 0.65 + 0.55 * uSurge;
        gl_PointSize = abovePool * clamp(aMeta.x * uPixelRatio * uViewportScale * surgeScale * (9.0 / max(-mvPos.z, 1.0)), 0.0, 32.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      varying float vLife;
      varying float vSpin;

      void main() {
        vec2 uv = rot2D(vSpin) * (gl_PointCoord - 0.5);
        float ang = atan2Safe(uv.y, uv.x);
        float r = length(uv);
        if (r > 0.47) discard;

        float globR = 0.31 + 0.055 * sin(ang * 3.0) + 0.035 * cos(ang * 5.0);
        if (r > globR + 0.045) discard;

        float mask = 1.0 - smoothstep(globR - 0.08, globR + 0.035, r);
        float rim = smoothstep(globR * 0.4, globR * 0.95, r);

        vec3 moltenGold = vec3(1.36, 0.92, 0.36);
        vec3 lavaOrange = vec3(1.04, 0.32, 0.018);
        vec3 darkScoria = vec3(0.060, 0.026, 0.022);

        vec3 col = mix(moltenGold, lavaOrange, smoothstep(0.08, 0.45, vLife));
        float crusting = smoothstep(0.46, 0.85, vLife + rim * 0.18);
        col = mix(col, darkScoria, crusting);

        float alpha = mask * smoothstep(0.0, 0.05, vLife) * (1.0 - smoothstep(0.84, 1.0, vLife)) * 0.92;
        if (alpha < 0.02) discard;

        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),k=new Vn(ce,b);k.frustumCulled=!1,k.renderOrder=9,e.add(k);const Q=800,N=new st,G=new Float32Array(Q*3),te=new Float32Array(Q*4);for(let ne=0;ne<Q;ne++)G[ne*3+0]=(Math.random()-.5)*24,G[ne*3+1]=Math.random()*6,G[ne*3+2]=(Math.random()-.5)*24,te[ne*4+0]=Math.random(),te[ne*4+1]=Math.random()*40,te[ne*4+2]=.055+Math.random()*.065,te[ne*4+3]=1.4+Math.random()*1.8;N.setAttribute("position",new De(G,3)),N.setAttribute("aData",new De(te,4));const O=new Ke({uniforms:t,transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
      ${je}
      attribute vec4 aData;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uViewportScale;
      uniform vec2 uWindVec;
      uniform float uFlicker;

      varying float vSpin;
      varying float vFireWarmth;
      varying float vFade;

      void main() {
        float phase = aData.x;
        float seed = aData.y;
        float life = fract(phase + uTime * aData.z);

        vec3 p = position;
        p.y = mod(position.y - life * 6.0, 6.0) - 0.35;
        p.x = mod(position.x + uWindVec.x * uTime * 1.4 + sin(uTime * 0.9 + seed) * 0.85 + 12.0, 24.0) - 12.0;
        p.z = mod(position.z + uWindVec.y * uTime * 1.4 + cos(uTime * 0.8 + seed) * 0.85 + 12.0, 24.0) - 12.0;

        float distPyre = length(p - vec3(0.35, 1.15, -0.30));
        vFireWarmth = (1.0 / (1.0 + distPyre * distPyre * 0.08)) * uFlicker;
        vSpin = uTime * 2.8 + seed;
        vFade = smoothstep(-0.35, 0.55, p.y) * (1.0 - smoothstep(4.2, 5.6, p.y));

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(aData.w * uPixelRatio * uViewportScale * (8.5 / max(-mvPos.z, 1.4)), 1.0, 5.5);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      ${je}
      ${rn}
      varying float vSpin;
      varying float vFireWarmth;
      varying float vFade;

      void main() {
        vec2 rawUv = gl_PointCoord - 0.5;
        if (length(rawUv) > 0.47) discard;
        vec2 uv = rot2D(vSpin) * rawUv;
        uv.y *= 1.40;
        float d = length(uv);
        if (d > 0.45) discard;

        float mask = 1.0 - smoothstep(0.20, 0.45, d);
        vec3 duskAsh = vec3(0.24, 0.145, 0.115);
        vec3 warmAsh = vec3(0.84, 0.34, 0.085);
        vec3 col = mix(duskAsh, warmAsh, clamp(vFireWarmth * 1.5, 0.0, 0.90));

        float alpha = mask * vFade * 0.26;
        if (alpha < 0.012) discard;
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),he=new Vn(N,O);he.frustumCulled=!1,he.renderOrder=11,e.add(he);const Ae=le+Je+J+Q,ee=new Le(0,0),me=new Le(0,0);let Ce=-1,Ie=!1,Me=0,Ye=0;return{name:"fire",title:"Fire · Volcanic Caldera",subtitle:"Smoky Dusk Lava Canyon & Active Fissure Wildfire",description:"An outdoor basalt fissure canyon at smoky twilight where cooling pahoehoe crust slabs drift and fracture down a recessed volcanic trench, igniting gnarled canyon timber beneath roaring orange-gold flames, a billowing smoke plume, ballistic lava spatter, and wind-carried embers.",stats:"4,200 GPU Particles · Recessed Lava Trench · Buoyant Wildfire",accent:"#ff6e24",scene:e,defaultCamera:{position:new D(2.45,2.55,10.8),target:new D(.35,1.05,-1.2),fov:46,minDistance:3.8,maxDistance:24,maxPolarAngle:Math.PI*.455},particleCount:Ae,update(ne,Se,L,ae=null){const V=Ce>=0?ne-Ce:.016,$=Math.min(Math.max(V,.001),.05);Ce=ne,t.uTime.value=ne,t.uIntensity.value=Se,t.uSurge.value=L,t.uViewportScale.value=ae&&ae.activeView==="all"?.52:1;const oe=.55+.45*Se+.35*L,re=(.26+.11*Math.sin(ne*.42)+.06*Math.cos(ne*1.1))*oe,ye=(.08+.07*Math.cos(ne*.34))*oe;let We=0,Ne=0;if(me.set(0,0),ae&&ae.pointerActive&&ae.pointerWorld){const Ze=ae.pointerWorld.x,rt=ae.pointerWorld.z;t.uPointerXZ.value.set(Ze,rt),Ne=1;const dt=Math.hypot(Ze-.35,rt+.3);if(dt<9.5){const Ue=1-An(.35,9.5,dt),ft=1/Math.max(dt,.45),ie=-(Ze-.35)*ft*Ue*.72,He=-(rt+.3)*ft*Ue*.72;let ze=0,Oe=0;Ie&&(ze=Math.max(-7,Math.min(7,(Ze-Me)/$))*.13*Ue,Oe=Math.max(-7,Math.min(7,(rt-Ye)/$))*.13*Ue),me.set(ie+ze,He+Oe),me.length()>1.35&&me.setLength(1.35),We=Math.min(1,Ue*(.72+Math.hypot(ze,Oe)*.65))}Me=Ze,Ye=rt,Ie=!0}else Ie=!1;const Ee=1-Math.exp(-$*6.8);ee.lerp(me,Ee),t.uDraftStrength.value+=(We-t.uDraftStrength.value)*Ee,t.uPointerInfluence.value+=(Ne-t.uPointerInfluence.value)*Ee,t.uWindVec.value.set(re+ee.x,ye+ee.y);const Ge=Math.sin(ne*12.8)*.32+Math.sin(ne*21.4+1.3)*.2+Math.cos(ne*6.9)*.24;t.uFlicker.value=1+Ge*.24,r.intensity=(5.4+Ge*.9)*Se+L*6.2,r.position.set(.35+t.uWindVec.value.x*.45,1.25+Math.sin(ne*4.8)*.15+L*.75,-.3+t.uWindVec.value.y*.45),o.intensity=(2.6+Math.sin(ne*15.2+2.1)*.44)*Se+L*2.4},onResize(ne){t.uPixelRatio.value=ne}}}const on=`
float safePow(float base, float expVal) {
  return pow(max(base, 0.0), expVal);
}

vec2 safeNorm2(vec2 v) {
  float lenSq = dot(v, v);
  return lenSq > 1e-10 ? v * inversesqrt(lenSq) : vec2(1.0, 0.0);
}

vec3 safeNorm3(vec3 v) {
  float lenSq = dot(v, v);
  return lenSq > 1e-10 ? v * inversesqrt(lenSq) : vec3(0.0, 1.0, 0.0);
}

float safeAtan(float y, float x) {
  return (abs(x) < 1e-6 && abs(y) < 1e-6) ? 0.0 : atan(y, x);
}

// Physical Rayleigh + Mie coastal golden-daylight sky radiance (linear <= 0.95 except sun disc)
vec3 evalCoastalSky(vec3 dir, vec3 sunDir) {
  float y = clamp(dir.y, -0.15, 1.0);
  float horizonT = exp(-max(y, 0.0) * 5.2);
  float zenithT = safePow(clamp(y, 0.0, 1.0), 0.58);

  vec3 zenithBlue = vec3(0.075, 0.245, 0.58);
  vec3 midSkyBlue = vec3(0.19, 0.43, 0.72);
  vec3 horizonHaze = vec3(0.56, 0.65, 0.72);

  vec3 sky = mix(midSkyBlue, zenithBlue, zenithT);
  sky = mix(sky, horizonHaze, horizonT * 0.86);

  float sunCos = clamp(dot(dir, sunDir), -1.0, 1.0);
  float mieWide = safePow(max(sunCos, 0.0), 5.0);
  float mieTight = safePow(max(sunCos, 0.0), 36.0);

  // Warm golden coastal Mie scattering near the sun & horizon
  sky += vec3(0.32, 0.21, 0.10) * mieWide * (0.45 + 0.55 * horizonT);
  sky += vec3(0.42, 0.32, 0.18) * mieTight * 0.65;

  // Darken gently below mathematical horizon for reflection lookups
  if (y < 0.0) {
    sky = mix(sky, vec3(0.03, 0.09, 0.16), clamp(-y * 6.0, 0.0, 1.0));
  }
  return sky;
}

// Distance aerial-perspective haze (delayed near-field onset so foreground cliffs & ocean stay crystal-clear)
vec3 applyAerialHaze(vec3 col, vec3 worldPos, vec3 camPos, vec3 sunDir, float density) {
  vec3 viewVec = worldPos - camPos;
  float dist = length(viewVec);
  vec3 dir = dist > 1e-4 ? viewVec / dist : vec3(0.0, 0.0, -1.0);
  vec3 horizonDir = safeNorm3(vec3(dir.x, max(dir.y * 0.25, 0.02), dir.z));
  vec3 hazeCol = evalCoastalSky(horizonDir, sunDir);
  float effDist = max(dist - 18.0, 0.0);
  float fogAmt = 1.0 - exp(-density * effDist * (0.62 + 0.38 * clamp(effDist / 58.0, 0.0, 1.0)));
  return mix(col, hazeCol, clamp(fogAmt, 0.0, 0.94));
}
`;function Tr(n,e){const t=Math.sin(n*127.1+e*311.7)*43758.5453123;return t-Math.floor(t)}function Uu(n,e){const t=Math.floor(n),i=Math.floor(e),a=n-t,r=e-i,o=a*a*(3-2*a),s=r*r*(3-2*r),l=Tr(t,i),c=Tr(t+1,i),f=Tr(t,i+1),d=Tr(t+1,i+1);return l+(c-l)*o+(f-l)*s+(l-c-f+d)*o*s}function Ar(n,e,t=4){let i=0,a=.5,r=1;for(let o=0;o<t;o++){i+=a*(Uu(n*r,e*r)*2-1);const s=n*.8-e*.6,l=n*.6+e*.8;n=s,e=l,r*=2.04,a*=.5}return i}function Hr(n,e,t=4){let i=0,a=.52,r=1;for(let o=0;o<t;o++){const s=1-Math.abs(Uu(n*r,e*r)*2-1);i+=s*s*a,r*=2.1,a*=.48}return i}function pn(n,e,t){const i=Math.max(0,Math.min(1,(t-n)/(e-n)));return i*i*(3-2*i)}function za(n,e){const t=-1.15*Math.exp(-Math.pow((e+3.5)/2.9,2)),i=3.2*pn(-6,-12.5,e),a=1.15*Math.exp(-Math.pow((e-1.8)/2.3,2)),r=-2.45+t+i+a+Ar(n*.25,e*.25,3)*.55,o=pn(-15.2,-11.2,n),s=pn(-16.2,-11.8,e),l=1-pn(4.2,8.2,e),c=o*s*l,f=r-n,d=pn(-2.4,-.15,f),h=pn(-.35,2.35,f),p=pn(1.8,5.2,f),g=Hr(n*.38+3.1,e*.38-1.7,4)*2.25,x=Ar(n*1.25,e*1.25,3)*.45;let m=-8.2+d*6.6+(h*8.1+p*2.4+g*h+x*h);const u=Math.sin(m*2.35)*.14*h;m+=u;const M=-3.5+Math.sin((n+6)*.45)*.16,S=Math.abs(e-M),v=Math.exp(-Math.pow((n+5.6)/1.18,2)),T=Math.exp(-Math.pow((n+4.05)/.85,2)),w=Math.exp(-Math.pow((S-1.18)/.54,2)),E=.82+.42*Hr(n*1.65+2.1,e*1.65-.8,2);m+=(v*.95+T*.48)*w*E*h;const C=1-pn(.44,1.52,S);if(C>.001&&n>-11.8&&n<-2.6){let P;if(n<-5.55)P=6.32+(-5.55-n)*.16;else if(n<-4.55){const X=(n- -5.55)/1;P=6.32-(6.32-3.6)*pn(0,1,X)}else if(n<-3.82){const X=(n- -4.55)/.73;P=3.6-.12*X-.1*Math.sin(X*Math.PI)}else{const X=Math.min(1,(n- -3.82)/.72);P=3.48-9*pn(0,1,X)}const I=.26*Math.pow(Math.min(S/.75,1),2),F=Ar(n*2.1,e*2.1,2)*.08;m=m*(1-C)+(P+I+F)*C}let y=-8.2+(m+8.2)*c;const _=[{bx:-1.15,bz:-1.15,rx:.8,rz:.68,bh:.92},{bx:-3.55,bz:1.15,rx:1.05,rz:.88,bh:1.25},{bx:-1.92,bz:2.38,rx:.74,rz:.62,bh:.7},{bx:.65,bz:-5.75,rx:1,rz:.8,bh:.98},{bx:-4.45,bz:-6.15,rx:1.15,rz:.96,bh:1.45}];for(let P=0;P<_.length;P++){const I=_[P],F=P*1.1,X=Math.cos(F),q=Math.sin(F),B=((n-I.bx)*X-(e-I.bz)*q)/I.rx,K=((n-I.bx)*q+(e-I.bz)*X)/I.rz,H=Ar(n*1.9+P*3.7,e*1.9,2)*.24,se=B*B+K*K+H;if(se<1.18){const ue=Hr(n*2.8+P*5,e*2.8,3)*.62,de=Math.sin(B*3.4+P)*.12,_e=Math.max(0,1-Math.max(0,se)),Re=-3.6+(I.bh+3.6+ue+de)*Math.pow(_e,1.18);y=Math.max(y,Re)}}return y}function wv(){const r=Math.ceil(175)+1,o=Math.ceil((9.2- -17.2)/.12)+1,s=r*o,l=new Float32Array(s);for(let m=0;m<o;m++){const u=-17.2+m*.12,M=m*r;for(let S=0;S<r;S++)l[M+S]=za(-16.8+S*.12,u)}const c=1e4,f=new Float32Array(s),d=new Float32Array(s);f.fill(c),d.fill(c);const h=[[1,0,.12],[-1,0,.12],[0,1,.12],[0,-1,.12],[1,1,.12*Math.SQRT2],[-1,1,.12*Math.SQRT2],[1,-1,.12*Math.SQRT2],[-1,-1,.12*Math.SQRT2]];for(let m=0;m<o;m++){const u=m*r;for(let M=0;M<r;M++){const S=u+M,v=l[S],T=v>=0;for(let w=0;w<h.length;w++){const E=M+h[w][0],C=m+h[w][1];if(E<0||E>=r||C<0||C>=o)continue;const y=l[C*r+E],_=y>=0;if(T!==_){const I=Math.abs(v)/Math.max(Math.abs(v-y),1e-5)*h[w][2];T?I<d[S]&&(d[S]=I):I<f[S]&&(f[S]=I)}}}}const p=[[-1,0,1],[0,-1,1],[-1,-1,Math.SQRT2],[1,-1,Math.SQRT2],[-2,-1,Math.SQRT5||Math.hypot(2,1)],[2,-1,Math.SQRT5||Math.hypot(2,1)],[-1,-2,Math.SQRT5||Math.hypot(1,2)],[1,-2,Math.SQRT5||Math.hypot(1,2)]],g=m=>{for(let u=0;u<o;u++){const M=u*r;for(let S=0;S<r;S++){let v=m[M+S];for(let T=0;T<p.length;T++){const w=S+p[T][0],E=u+p[T][1];if(w>=0&&w<r&&E>=0&&E<o){const C=m[E*r+w]+p[T][2]*.12;C<v&&(v=C)}}m[M+S]=v}}for(let u=o-1;u>=0;u--){const M=u*r;for(let S=r-1;S>=0;S--){let v=m[M+S];for(let T=0;T<p.length;T++){const w=S-p[T][0],E=u-p[T][1];if(w>=0&&w<r&&E>=0&&E<o){const C=m[E*r+w]+p[T][2]*.12;C<v&&(v=C)}}m[M+S]=v}}};g(f),g(d);const x=new Float32Array(s);for(let m=0;m<s;m++)x[m]=l[m]>=0?-d[m]:f[m];return function(u,M,S){if(u<=-16.8||u>=4.2||M<=-17.2||M>=9.2){const B=u<-16.8?-16.8-u:u>4.2?u-4.2:0,K=M<-17.2?-17.2-M:M>9.2?M-9.2:0,H=Math.max(-16.8,Math.min(4.2-1e-4,u)),se=Math.max(-17.2,Math.min(9.2-1e-4,M)),ue=(H- -16.8)/.12,de=(se- -17.2)/.12,_e=Math.min(r-2,Math.max(0,Math.floor(ue))),Re=Math.min(o-2,Math.max(0,Math.floor(de))),j=x[Re*r+_e];S[0]=Math.max(j,0)+Math.hypot(B,K),S[1]=-8.2-Math.max(0,u-2.5)*.55-Math.max(0,-M-10)*.42;return}const v=(u- -16.8)/.12,T=(M- -17.2)/.12,w=Math.min(r-2,Math.floor(v)),E=Math.min(o-2,Math.floor(T)),C=v-w,y=T-E,_=(1-C)*(1-y),P=C*(1-y),I=(1-C)*y,F=C*y,X=E*r+w,q=X+r;S[0]=x[X]*_+x[X+1]*P+x[q]*I+x[q+1]*F,S[1]=l[X]*_+l[X+1]*P+l[q]*I+l[q+1]*F}}function bv(){const n=new Ka,e=typeof window<"u"?Math.min(window.devicePixelRatio||1,2):1,t=new D(-.09,.205,-.974).normalize(),i=new Le(-2.68,-3.5),a={uTime:{value:0},uIntensity:{value:1},uSurge:{value:0},uPixelRatio:{value:e},uViewportScale:{value:1},uSunDir:{value:t.clone()},uPlungeCenter:{value:i.clone()},uPointerXZ:{value:new Le(0,0)},uPointerActive:{value:0},uRippleStrength:{value:0}},r=new ao(9225460,1848642,.95);n.add(r);const o=new ro(16773590,1.65);o.position.copy(t).multiplyScalar(60),n.add(o);const s=new Ke({uniforms:a,side:Lt,depthWrite:!1,depthTest:!1,vertexShader:`
      varying vec3 vWorldDir;
      void main() {
        vWorldDir = position;
        vec4 worldPos = vec4(cameraPosition + position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,fragmentShader:`
      ${je}
      ${on}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec3 uSunDir;

      varying vec3 vWorldDir;

      void main() {
        vec3 dir = safeNorm3(vWorldDir);
        vec3 col = evalCoastalSky(dir, uSunDir);

        // Soft drifting coastal cirrus & distant marine cumulus clouds above horizon
        if (dir.y > 0.005) {
          vec2 skyPlane = dir.xz / (dir.y + 0.14);
          float drift = uTime * (0.018 + 0.008 * uIntensity + 0.012 * uSurge);

          // High wispy cirrus streaks
          float cirrusN = fbm4(vec3(skyPlane.x * 0.55 + drift, skyPlane.y * 0.35 - drift * 0.4, 1.7));
          float cirrusMask = smoothstep(0.12, 0.62, cirrusN) * smoothstep(0.02, 0.24, dir.y) * (1.0 - smoothstep(0.55, 0.92, dir.y));

          // Low horizon coastal cumulus puffs
          float cumN = fbm4(vec3(skyPlane * 0.95 + vec2(drift * 1.4, -drift * 0.6), 4.3));
          float cumDetail = snoise(vec3(skyPlane * 2.4 + vec2(drift * 1.8, 0.0), 8.1)) * 0.25;
          float cumMask = smoothstep(0.18, 0.58, cumN + cumDetail) * smoothstep(0.01, 0.08, dir.y) * (1.0 - smoothstep(0.14, 0.34, dir.y));

          float sunAlign = clamp(dot(dir, uSunDir) * 0.5 + 0.5, 0.0, 1.0);
          vec3 cloudLit = mix(vec3(0.76, 0.81, 0.86), vec3(0.94, 0.84, 0.68), safePow(sunAlign, 2.2));
          vec3 cloudShadow = vec3(0.34, 0.43, 0.55);

          col = mix(col, cloudLit, cirrusMask * 0.38);
          vec3 cumCol = mix(cloudShadow, cloudLit, smoothstep(0.15, 0.55, cumN + 0.15));
          col = mix(col, cumCol, cumMask * 0.52);
        }

        // Crisp HDR solar disc & tight circumsolar glint (exceeds 1.05 bloom threshold cleanly)
        float sunCos = dot(dir, uSunDir);
        float sunDisc = smoothstep(0.99935, 0.99978, sunCos);
        float sunCorona = safePow(max(sunCos, 0.0), 320.0) * 0.55;
        float horizonVis = smoothstep(-0.01, 0.03, dir.y);
        col += vec3(2.15, 1.82, 1.32) * (sunDisc + sunCorona) * horizonVis;

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),l=new ut(new ya(85,48,32),s);l.frustumCulled=!1,l.renderOrder=-100,n.add(l);const c=96,f=18,d=new en(92,26,c,f);d.rotateX(-Math.PI/2);const h=d.attributes.position;for(let N=0;N<h.count;N++){const G=h.getX(N)-24,te=h.getZ(N)-66,O=(G+70)/92,he=Math.sin(Math.max(0,Math.min(1,(te+79)/26))*Math.PI),Ae=1-pn(.56,.88,O),ee=Hr(G*.085+7.2,te*.095,4),me=Math.exp(-Math.pow((G+6.5)/2.2,2)-Math.pow((te+60)/2.5,2))*5.2,Ce=Math.exp(-Math.pow((G-1.5)/1.5,2)-Math.pow((te+57.5)/1.8,2))*3.6,Ie=-1.2+(ee*9.8*Ae+me+Ce)*he;h.setXYZ(N,G,Ie,te)}d.computeVertexNormals(),d.computeBoundingSphere();const p=new Ke({uniforms:a,vertexShader:`
      ${on}
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormal = safeNorm3(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${on}
      uniform vec3 uSunDir;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      void main() {
        float crag = 1.0 - abs(snoise(vWorldPos * 0.45));
        vec3 N = safeNorm3(vNormal + vec3(crag * 0.22, 0.0, -crag * 0.18));
        float sunLit = max(dot(N, uSunDir), 0.0);
        vec3 rockBase = mix(vec3(0.042, 0.068, 0.105), vec3(0.135, 0.155, 0.168), clamp(vWorldPos.y * 0.12 + crag * 0.25, 0.0, 1.0));
        vec3 col = rockBase + vec3(0.26, 0.20, 0.13) * sunLit * 0.48;
        // Heavy coastal marine-layer aerial perspective
        col = applyAerialHaze(col, vWorldPos, cameraPosition, uSunDir, 0.028);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),g=new ut(d,p);n.add(g);const x=136,m=128,u=new en(18.5,24.5,x,m);u.rotateX(-Math.PI/2);const M=u.attributes.position,S=new Float32Array(M.count);for(let N=0;N<M.count;N++){const G=M.getX(N)-5.95,te=M.getZ(N)-3.95,O=za(G,te);M.setXYZ(N,G,O,te),S[N]=O}u.setAttribute("aHeight",new De(S,1)),u.computeVertexNormals(),u.computeBoundingSphere();const v=new Ke({uniforms:a,vertexShader:`
      ${on}
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = safeNorm3(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${on}
      uniform float uTime;
      uniform float uSurge;
      uniform vec3 uSunDir;
      uniform vec2 uPlungeCenter;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      // Fast chiseled 3D fractured basalt & geological strata heightfield for finite-difference bump normals
      float evalBasaltRelief(vec3 p) {
        float colJoint = 1.0 - abs(snoise(vec3(p.x * 1.75, p.y * 0.55, p.z * 1.75)));
        float crag = 1.0 - abs(snoise(p * 4.6 + vec3(3.1, -1.9, 2.4)));
        float fine = snoise(p * 11.5) * 0.14;
        float strata = sin(p.y * 7.4 + colJoint * 2.5) * 0.18;
        return colJoint * colJoint * 0.58 + crag * crag * 0.30 + strata + fine;
      }

      void main() {
        vec3 V = safeNorm3(cameraPosition - vWorldPos);
        float camDist = length(cameraPosition - vWorldPos);
        float bumpFade = 1.0 - smoothstep(18.0, 58.0, camDist);

        // True finite-difference 3D rock bump-normals (zero Voronoi grid lines, razor-sharp fractures!)
        float eps = 0.042;
        float h0 = evalBasaltRelief(vWorldPos);
        float hx = evalBasaltRelief(vWorldPos + vec3(eps, 0.0, 0.0));
        float hy = evalBasaltRelief(vWorldPos + vec3(0.0, eps, 0.0));
        float hz = evalBasaltRelief(vWorldPos + vec3(0.0, 0.0, eps));
        vec3 reliefGrad = vec3(hx - h0, hy - h0, hz - h0) / eps;

        float strataWarp = snoise(vWorldPos * 0.62);
        float strataBands = sin(vWorldPos.y * 5.8 + strataWarp * 3.4) * 0.5 + 0.5;
        float crevice = clamp(0.45 + h0 * 0.65, 0.35, 1.05);

        // Physical wetness: glossy dark intertidal wave-splash band (y < 1.5m) + waterfall mist zone
        float rockWaveLine = 1.38 + 0.52 * uSurge + 0.18 * sin(uTime * 1.6 + vWorldPos.z * 0.9) + strataWarp * 0.16;
        float waveWet = 1.0 - smoothstep(0.55, rockWaveLine, vWorldPos.y);

        float distToChuteZ = abs(vWorldPos.z - (-3.50));
        float inRiverBed = (1.0 - smoothstep(0.55, 1.55, distToChuteZ))
          * smoothstep(-11.5, -9.5, vWorldPos.x) * (1.0 - smoothstep(-2.8, -2.0, vWorldPos.x));
        float distPlunge = length(vWorldPos.xz - uPlungeCenter);
        float sprayWet = exp(-distPlunge * distPlunge * 0.14) * (1.0 - smoothstep(1.2, 4.9, vWorldPos.y));

        float wetness = clamp(max(waveWet, max(inRiverBed * 0.96, sprayWet * 0.88)), 0.0, 0.98);

        // Project bump gradient onto tangent plane so crags & sea-stacks read as sharply sculpted stone
        vec3 baseN = safeNorm3(vWorldNormal);
        vec3 tangGrad = reliefGrad - baseN * dot(reliefGrad, baseN);
        float bumpStrength = mix(0.44, 0.28, wetness * 0.6) * bumpFade;
        vec3 N = safeNorm3(baseN - tangGrad * bumpStrength);

        // Base coastal basalt, warm ironstone mineral seams & upland coastal moss/turf
        vec3 darkBasalt = vec3(0.048, 0.052, 0.062);
        vec3 warmSlate = vec3(0.148, 0.132, 0.115);
        vec3 mineralRust = vec3(0.20, 0.135, 0.085);
        vec3 coastalMoss = vec3(0.062, 0.158, 0.045);
        vec3 tidalKelp = vec3(0.024, 0.048, 0.032);

        vec3 albedo = mix(darkBasalt, warmSlate, clamp(strataBands * 0.68 + (h0 - 0.4) * 0.45, 0.0, 1.0));
        albedo = mix(albedo, mineralRust, smoothstep(0.35, 0.88, strataWarp) * 0.36);
        albedo *= crevice;

        // Lush coastal moss & sea-thrift turf cushions on drier sunlit terraces & cliff shoulders
        float mossSlope = smoothstep(0.24, 0.66, baseN.y) * smoothstep(0.42, 0.78, N.y);
        float mossElev = smoothstep(2.2, 4.2, vWorldPos.y) * (1.0 - inRiverBed);
        float mossPatch = smoothstep(-0.12, 0.44, fbm4(vWorldPos * 0.48 + 4.0));
        albedo = mix(albedo, coastalMoss, mossSlope * mossElev * mossPatch * (1.0 - wetness * 0.85) * 0.86);

        // Dark intertidal kelp/barnacle band near mean sea level
        float kelpBand = (1.0 - smoothstep(-0.2, 0.60, abs(vWorldPos.y - 0.18))) * (1.0 - mossElev);
        albedo = mix(albedo, tidalKelp, kelpBand * 0.58);

        // Strong physical darkening & rich saturation on wet wave-splashed intertidal basalt
        albedo *= mix(1.0, 0.33, wetness);

        // Natural outdoor illumination: Golden sun + East sky bounce + Turquoise cove water bounce
        float sunDiff = max(dot(N, uSunDir), 0.0);
        vec3 eastBounceDir = safeNorm3(vec3(0.82, 0.46, 0.34));
        float skyBounce = max(dot(N, eastBounceDir), 0.0);
        vec3 skyHemi = mix(vec3(0.045, 0.075, 0.11), vec3(0.20, 0.30, 0.44), N.y * 0.5 + 0.5);

        // Subtle upward organic water-caustic reflection onto wet undercut cliff walls near sea level
        float cRipple = ridgedFbm(vec3(vWorldPos.z * 1.6, vWorldPos.y * 1.9 - uTime * 0.65, uTime * 0.35));
        float bounceCaustic = safePow(cRipple, 2.8)
          * (1.0 - smoothstep(0.0, 3.0, vWorldPos.y)) * smoothstep(-0.2, 0.0, vWorldPos.y)
          * clamp(0.65 - N.y * 0.5, 0.0, 1.0);

        vec3 irradiance = skyHemi * 0.96
          + vec3(0.98, 0.78, 0.54) * sunDiff * 1.22
          + vec3(0.26, 0.39, 0.54) * skyBounce * 0.62
          + vec3(0.06, 0.28, 0.32) * bounceCaustic * 0.52;

        vec3 col = albedo * irradiance;

        // Glossy wet intertidal specular sheen & sky Fresnel reflection on sea-stacks & cliff foot
        float shininess = mix(16.0, 118.0, wetness);
        float specMask = mix(0.05, 0.72, wetness);
        float sunSpec = safePow(max(dot(N, safeNorm3(uSunDir + V)), 0.0), shininess) * specMask;
        float skySpec = safePow(max(dot(N, safeNorm3(eastBounceDir + V)), 0.0), shininess * 0.48) * specMask * 0.55;
        float wetFresnel = safePow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.8) * wetness;

        col += vec3(0.98, 0.85, 0.66) * sunSpec + vec3(0.48, 0.68, 0.88) * skySpec;
        col += vec3(0.20, 0.38, 0.54) * wetFresnel * 0.44;

        // Clinging bubbly whitewash swash film right at the wave-beaten cliff toe & sea-stack waterline
        float swashRunup = 0.28 + 0.24 * uSurge + 0.14 * sin(uTime * 2.05 + vWorldPos.z * 0.75 + strataWarp * 2.0);
        float swashBand = smoothstep(-0.14, 0.02, vWorldPos.y) * (1.0 - smoothstep(0.06, swashRunup, vWorldPos.y));
        if (swashBand > 0.005) {
          float rockFroth = ridgedFbm(vec3(vWorldPos.xz * 2.6, uTime * 0.42)) * 0.65
            + (snoise(vec3(vWorldPos * 8.5 + vec3(0.0, uTime * 0.9, 0.0))) * 0.5 + 0.5) * 0.35;
          float clingMask = swashBand * smoothstep(0.32, 0.78, rockFroth) * smoothstep(-6.2, -3.2, vWorldPos.x);
          vec3 swashTone = mix(vec3(0.38, 0.48, 0.58), vec3(0.78, 0.82, 0.84), 0.45 + 0.55 * sunDiff);
          col = mix(col, swashTone, clingMask * 0.72);
        }

        // Underwater depth tinting for submerged boulder bases (y < 0)
        if (vWorldPos.y < 0.0) {
          float subDepth = clamp(-vWorldPos.y * 0.95, 0.0, 1.0);
          col = mix(col, vec3(0.006, 0.048, 0.095), subDepth * 0.88);
        }

        col = applyAerialHaze(col, vWorldPos, cameraPosition, uSunDir, 0.011);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),T=new ut(u,v);T.renderOrder=1,n.add(T);const w=wv(),E=272,C=new en(2,2,E,E),y=C.attributes.position,_=new Float32Array(y.count),P=new Float32Array(y.count),I=[0,0];for(let N=0;N<y.count;N++){const G=y.getX(N),te=y.getY(N),O=Math.abs(G),he=Math.abs(te),Ae=Math.sign(G)*(O*11.5+Math.pow(O,3.6)*83.5)+.6,ee=-Math.sign(te)*(he*11.8+Math.pow(he,3.6)*83.2)+1.8;y.setXYZ(N,Ae,0,ee),w(Ae,ee,I),P[N]=I[0],_[N]=Math.max(-.6,-I[1])}C.setAttribute("aWaterDepth",new De(_,1)),C.setAttribute("aShoreDist",new De(P,1)),C.computeBoundingSphere();const F=new Ke({uniforms:a,transparent:!0,depthWrite:!0,vertexShader:`
      ${je}
      ${on}
      attribute float aWaterDepth;
      attribute float aShoreDist;

      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec2 uPlungeCenter;
      uniform vec2 uPointerXZ;
      uniform float uRippleStrength;

      varying vec3 vWorldPos;
      varying vec3 vGerstnerNormal;
      varying float vDepth;
      varying float vShoreDist;
      varying float vJacobianFoam;
      varying float vWaveHeight;

      // Accumulates a physical directional Gerstner wave with controlled trochoidal pinch
      // so foreground wave crests curve with silky C2 smoothness and never self-intersect!
      void addGerstnerWave(
        vec2 xz,
        vec2 dir,
        float wavelength,
        float steepness,
        float pinchScale,
        float speedScale,
        float t,
        inout vec3 disp,
        inout vec3 tangentX,
        inout vec3 tangentZ,
        inout float crestCompression
      ) {
        float k = 6.2831853 / wavelength;
        float c = sqrt(9.81 / k) * speedScale;
        float a = (steepness / k);
        float phase = k * dot(dir, xz) - c * k * t;
        float s = sin(phase);
        float co = cos(phase);

        float horizA = a * pinchScale;
        disp.x += dir.x * (horizA * co);
        disp.y += a * s;
        disp.z += dir.y * (horizA * co);

        float wa = k * a;
        float wqa = wa * pinchScale;
        tangentX += vec3(-dir.x * dir.x * wqa * s, dir.x * wa * co, -dir.x * dir.y * wqa * s);
        tangentZ += vec3(-dir.x * dir.y * wqa * s, dir.y * wa * co, -dir.y * dir.y * wqa * s);
        crestCompression += wa * s;
      }

      void main() {
        vec2 xz = position.xz;
        float depth = aWaterDepth;
        float shoreDist = aShoreDist;
        vDepth = depth;
        vShoreDist = shoreDist;

        // Smooth horizontal rock-contact wave slosh & far-horizon damping (zero cliff-wall kinking!)
        float distOrigin = length(xz);
        float horizonDamp = 1.0 - smoothstep(46.0, 90.0, distOrigin);
        float shoalAmp = mix(0.28, 1.0, smoothstep(-0.08, 1.15, shoreDist))
          * smoothstep(-0.45, -0.04, shoreDist);

        // Gently temper near-camera steepness & short-wave chop so the closest wave crest is silky-smooth
        float camDistXZ = length(cameraPosition.xz - xz);
        float nearCamTemper = mix(0.76, 1.0, smoothstep(3.2, 10.5, camDistXZ));
        float chopMeshFade = mix(0.42, 1.0, smoothstep(4.5, 13.0, camDistXZ)) * (1.0 - smoothstep(26.0, 56.0, distOrigin));

        float energy = (0.80 + 0.26 * uIntensity + 0.68 * uSurge) * shoalAmp * horizonDamp * nearCamTemper;
        float pinchGuard = 1.0 / (1.0 + 0.42 * uSurge);

        float t = uTime * (0.95 + 0.12 * uIntensity + 0.18 * uSurge);

        vec3 disp = vec3(0.0);
        vec3 tanX = vec3(1.0, 0.0, 0.0);
        vec3 tanZ = vec3(0.0, 0.0, 1.0);
        float crestComp = 0.0;

        // 6-component directional ocean swell spectrum rolling in from open sea (-Z, +X) toward the cove
        addGerstnerWave(xz, safeNorm2(vec2(-0.62, 0.78)), 13.5, 0.145 * energy, 0.62 * pinchGuard, 1.00, t, disp, tanX, tanZ, crestComp);
        addGerstnerWave(xz, safeNorm2(vec2(-0.38, 0.92)),  8.2, 0.120 * energy, 0.54 * pinchGuard, 1.04, t, disp, tanX, tanZ, crestComp);
        addGerstnerWave(xz, safeNorm2(vec2(-0.82, 0.57)),  5.1, 0.094 * energy, 0.45 * pinchGuard, 0.98, t, disp, tanX, tanZ, crestComp);
        addGerstnerWave(xz, safeNorm2(vec2(-0.18, 0.98)),  3.1, 0.068 * energy, 0.34 * pinchGuard, 1.06, t, disp, tanX, tanZ, crestComp);
        addGerstnerWave(xz, safeNorm2(vec2(-0.72, 0.25)),  1.95, 0.046 * energy * chopMeshFade, 0.22 * pinchGuard, 1.02, t, disp, tanX, tanZ, crestComp);
        addGerstnerWave(xz, safeNorm2(vec2( 0.24, 0.97)),  1.28, 0.032 * energy * chopMeshFade, 0.16 * pinchGuard, 1.08, t, disp, tanX, tanZ, crestComp);

        // Subtle concentric gravity wave rings radiating from the waterfall impact (no raised mound!)
        vec2 toPlunge = xz - uPlungeCenter;
        float dPlunge = length(toPlunge);
        vec2 plungeDir = safeNorm2(toPlunge);
        float plungeEnv = exp(-dPlunge * 0.26) * smoothstep(0.18, 0.85, dPlunge) * (1.0 + 0.45 * uSurge);
        float pPhase = dPlunge * 5.2 - uTime * 6.4;
        float pAmp = 0.028 * plungeEnv;
        disp.y += sin(pPhase) * pAmp;
        vec2 pGrad = plungeDir * (cos(pPhase) * 5.2 * pAmp);
        tanX.y += pGrad.x;
        tanZ.y += pGrad.y;

        // Interactive 3D pointer expanding concentric water ripples
        if (uRippleStrength > 0.002) {
          vec2 toPtr = xz - uPointerXZ;
          float dPtr = length(toPtr);
          vec2 ptrDir = safeNorm2(toPtr);
          float ptrEnv = exp(-dPtr * 0.42) * smoothstep(0.05, 0.35, dPtr) * uRippleStrength;
          float rPhase = dPtr * 7.8 - uTime * 9.2;
          float rAmp = 0.075 * ptrEnv;
          disp.y += sin(rPhase) * rAmp;
          vec2 rGrad = ptrDir * (cos(rPhase) * 7.8 * rAmp);
          tanX.y += rGrad.x;
          tanZ.y += rGrad.y;
        }

        vec3 finalPos = vec3(xz.x + disp.x, disp.y, xz.y + disp.z);
        vec3 crossN = cross(tanZ, tanX);
        vGerstnerNormal = safeNorm3(crossN);

        // Crest steepness & Jacobian compression detects breaking wave crests physically
        float jacobian = tanX.x * tanZ.z - tanX.z * tanZ.x;
        vJacobianFoam = clamp(max(1.0 - jacobian, crestComp * 0.92), 0.0, 1.2);
        vWaveHeight = disp.y;

        vec4 wp = modelMatrix * vec4(finalPos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${on}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec3 uSunDir;
      uniform vec2 uPlungeCenter;
      uniform vec2 uPointerXZ;
      uniform float uRippleStrength;

      varying vec3 vWorldPos;
      varying vec3 vGerstnerNormal;
      varying float vDepth;
      varying float vShoreDist;
      varying float vJacobianFoam;
      varying float vWaveHeight;

      void main() {
        vec3 viewVec = cameraPosition - vWorldPos;
        float camDist = length(viewVec);
        vec3 V = camDist > 1e-4 ? viewVec / camDist : vec3(0.0, 1.0, 0.0);

        // Boosted 3-octave animated capillary wind-ripples (~1.85x) for crisp Fresnel & sun-glitter facets
        float detailFade = 1.0 - smoothstep(16.0, 66.0, camDist);
        float fineFade = 1.0 - smoothstep(8.0, 32.0, camDist);
        vec2 windDrift1 = vec2(-uTime * 0.44, uTime * 0.58);
        vec2 windDrift2 = vec2(uTime * 0.34, uTime * 0.72);
        vec2 windDrift3 = vec2(-uTime * 0.62, uTime * 0.88);

        float cap1X = snoise(vec3(vWorldPos.xz * 2.1 + windDrift1, uTime * 0.65));
        float cap1Z = snoise(vec3(vWorldPos.xz * 2.1 + windDrift1 + vec2(4.7, -3.1), uTime * 0.65));
        float cap2X = snoise(vec3(vWorldPos.xz * 6.4 + windDrift2, uTime * 1.15));
        float cap2Z = snoise(vec3(vWorldPos.xz * 6.4 + windDrift2 + vec2(-2.9, 5.3), uTime * 1.15));
        float cap3X = snoise(vec3(vWorldPos.xz * 15.2 + windDrift3, uTime * 1.65)) * fineFade;
        float cap3Z = snoise(vec3(vWorldPos.xz * 15.2 + windDrift3 + vec2(3.3, -4.4), uTime * 1.65)) * fineFade;

        // Add subtle radiating turbulent surface chop around the waterfall plunge basin
        vec2 plungeDelta = vWorldPos.xz - uPlungeCenter;
        vec2 plungeFlowVec = vec2(plungeDelta.x * (plungeDelta.x > 0.0 ? 0.64 : 1.05), plungeDelta.y * 0.82);
        float dPlungeOut = length(plungeFlowVec);
        float plungeRip = sin(dPlungeOut * 9.5 - uTime * 9.8 + cap1X * 2.0) * exp(-dPlungeOut * 0.42);
        vec2 plungeNormPerturb = safeNorm2(plungeDelta) * plungeRip * 0.085;

        vec3 capPerturb = vec3(
          cap1X * 0.122 + cap2X * 0.068 + cap3X * 0.038 + plungeNormPerturb.x,
          0.0,
          cap1Z * 0.122 + cap2Z * 0.068 + cap3Z * 0.038 + plungeNormPerturb.y
        ) * detailFade * (0.88 + 0.32 * uIntensity + 0.25 * uSurge);

        vec3 N = safeNorm3(vGerstnerNormal + capPerturb);
        float ndv = clamp(dot(N, V), 0.001, 1.0);

        // True physical Schlick Fresnel for air-water interface (F0 = 0.02)
        float fresnel = 0.02 + 0.98 * safePow(1.0 - ndv, 5.0);

        // Sky reflection with realistic dark cliff-wall occlusion in the sheltered cove
        vec3 reflDir = reflect(-V, N);
        reflDir.y = max(reflDir.y, 0.012);
        reflDir = safeNorm3(reflDir);
        vec3 skyRefl = evalCoastalSky(reflDir, uSunDir);

        // When reflected ray points toward the towering left cliff (-X) inside the cove, reflect dark wet cliff!
        float nearCliff = (1.0 - smoothstep(-2.0, 7.5, vWorldPos.x)) * (1.0 - smoothstep(6.0, 15.0, abs(vWorldPos.z + 3.0)));
        float hitsCliff = smoothstep(-0.05, 0.55, -reflDir.x) * (1.0 - smoothstep(0.25, 0.68, reflDir.y));
        vec3 cliffReflTint = vec3(0.018, 0.032, 0.045);
        skyRefl = mix(skyRefl, cliffReflTint, nearCliff * hitsCliff * 0.78);

        // Deep Beer-Lambert absorption: rich Pacific sapphire-navy troughs -> emerald-turquoise shallows
        float effDepth = max(vDepth + vWaveHeight, 0.0);
        float troughDepthShade = mix(0.62, 1.15, smoothstep(-0.28, 0.26, vWaveHeight));
        float shallowMask = exp(-effDepth * 0.58);
        float midMask = exp(-effDepth * 0.16);

        vec3 deepSapphireNavy = vec3(0.003, 0.022, 0.072);
        vec3 midPelagicBlue   = vec3(0.008, 0.088, 0.178);
        vec3 shallowEmerald   = vec3(0.018, 0.255, 0.275);

        vec3 waterBody = mix(deepSapphireNavy, midPelagicBlue, midMask) * troughDepthShade;
        waterBody = mix(waterBody, shallowEmerald, shallowMask * 0.78);

        // Aerated subsurface bubble-plume turquoise glow in the waterfall plunge channel & cliff-toe surf zone
        float plungeAerated = exp(-dPlungeOut * dPlungeOut * 0.14);
        float shoreAerated = (1.0 - smoothstep(0.0, 1.55, vShoreDist)) * smoothstep(-0.25, 0.0, vShoreDist);
        waterBody = mix(waterBody, vec3(0.048, 0.42, 0.44), clamp(plungeAerated * 0.68 + shoreAerated * 0.44, 0.0, 0.78));

        // Luminous emerald-teal subsurface scattering through backlit thin wave crests
        float crestThin = smoothstep(-0.01, 0.24, vWaveHeight) * (0.48 + 0.82 * vJacobianFoam);
        vec3 backSunDir = safeNorm3(vec3(uSunDir.x, uSunDir.y * 0.30, uSunDir.z));
        float sunBackScatter = safePow(clamp(dot(V, -backSunDir) * 0.5 + 0.5, 0.0, 1.0), 2.4);
        float slopeSun = clamp(0.45 + 0.55 * dot(N, -backSunDir), 0.0, 1.0);
        vec3 sssEmerald = vec3(0.024, 0.48, 0.43);
        waterBody += sssEmerald * crestThin * slopeSun * (0.34 + 0.72 * sunBackScatter) * (0.88 + 0.36 * uSurge);

        vec3 col = mix(waterBody, skyRefl, clamp(fresnel * 1.04, 0.0, 0.95));

        // Sparkling GGX micro-facet ocean sun-glitter path + warm golden swell sheen
        vec3 H = safeNorm3(uSunDir + V);
        float ndh = max(dot(N, H), 0.0);
        float sunFacing = max(dot(N, uSunDir), 0.0);
        float roughSq = 0.0036 + 0.0032 * (1.0 - detailFade);
        float denom = ndh * ndh * (roughSq - 1.0) + 1.0;
        float ggxGlint = roughSq / max(3.14159265 * denom * denom, 1e-4);
        float sunSparkle = min(ggxGlint * 0.088, 2.25) * sunFacing;
        float glitterBroad = safePow(ndh, 42.0) * 0.38 * sunFacing;

        col += vec3(1.42, 1.16, 0.82) * sunSparkle + vec3(0.92, 0.72, 0.46) * glitterBroad;

        // 100% Organic FBM + Ridged-Multifractal Lacy Seafoam (ZERO geometric Voronoi polygons!)
        vec2 fDrift = vec2(-uTime * 0.22, uTime * 0.30);
        vec2 warp = vec2(
          snoise(vec3(vWorldPos.xz * 0.72 + fDrift * 0.5, uTime * 0.20)),
          snoise(vec3(vWorldPos.xz * 0.72 - fDrift * 0.4 + vec2(5.1, 2.9), uTime * 0.20))
        ) * 0.65;
        vec2 foamCoord = vWorldPos.xz + warp;

        float webRidge = ridgedFbm(vec3(foamCoord * 1.45 + fDrift, uTime * 0.32));
        float webFbm   = fbm4(vec3(foamCoord * 3.75 - fDrift * 1.2, uTime * 0.48)) * 0.5 + 0.5;
        float fineFroth = snoise(vec3(foamCoord * 9.6 + fDrift * 1.6, uTime * 0.85)) * 0.5 + 0.5;
        float organicLace = clamp(smoothstep(0.36, 0.86, webRidge * 0.68 + webFbm * 0.42) * (0.52 + 0.48 * fineFroth), 0.0, 1.0);

        // (1) Churning waterfall plunge-pool cauldron + concentric aerated whitewater foam rings
        // radiating clearly between the two sea-stacks!
        float plungeTurb = smoothstep(0.20, 0.78, webFbm * 0.58 + fineFroth * 0.54);
        float plungeBoil = exp(-dPlungeOut * dPlungeOut * 0.38) * (0.48 + 0.56 * plungeTurb) * (0.94 + 0.32 * uSurge);

        float plungeWarpDist = dPlungeOut + (webFbm - 0.5) * 0.52 + (fineFroth - 0.5) * 0.20;
        float ringWave1 = sin(plungeWarpDist * 4.8 - uTime * 5.3) * 0.5 + 0.5;
        float ringWave2 = sin(plungeWarpDist * 8.7 - uTime * 8.5 + webRidge * 2.1) * 0.5 + 0.5;
        float ringCrests = smoothstep(0.40, 0.90, ringWave1) * 0.76 + smoothstep(0.50, 0.95, ringWave2) * 0.44;
        float plungeRings = ringCrests * exp(-dPlungeOut * 0.33) * smoothstep(0.28, 0.95, dPlungeOut)
          * (0.46 + 0.64 * organicLace) * (0.96 + 0.34 * uSurge);

        // (2) Realistic Cliff-Toe & Sea-Stack Surge Whitewash Fringe (driven by true horizontal vShoreDist!)
        float waveRunup = clamp(vWaveHeight * 1.75 + 0.24, 0.0, 0.78) + 0.30 * uSurge;
        float swashOsc = 0.14 * sin(uTime * 2.05 - vShoreDist * 3.6 + vWorldPos.z * 0.75 + webFbm * 2.2);
        float collarWidth = max(0.44 + 0.34 * waveRunup + swashOsc, 0.24);

        // Dense bubbly swash collar hugging the vertical basalt cliff wall & sea-stack bases
        float innerSwash = (1.0 - smoothstep(0.06, collarWidth, vShoreDist))
          * smoothstep(-0.22, -0.02, vShoreDist);
        float bubblyEdge = clamp(0.56 + 0.44 * (webRidge * 0.55 + fineFroth * 0.65), 0.0, 1.0);

        // Trailing lacy surge/backwash foam web extending 0.4m..1.35m offshore from rocks
        float outerSurgeBand = (1.0 - smoothstep(collarWidth * 0.45, collarWidth + 0.88 + 0.35 * uSurge, vShoreDist))
          * smoothstep(-0.08, 0.12, vShoreDist);
        float shoreFoam = clamp(innerSwash * bubblyEdge * 0.96 + outerSurgeBand * organicLace * 0.86, 0.0, 1.0);

        // (3) Steep open-sea breaking whitecap streaks + interactive pointer wake
        float horizonFade = 1.0 - smoothstep(42.0, 84.0, camDist);
        float whitecap = smoothstep(0.32 - 0.09 * uSurge, 0.68, vJacobianFoam + vWaveHeight * 0.55)
          * organicLace * horizonFade;
        float dPtr = length(vWorldPos.xz - uPointerXZ);
        float ptrWake = exp(-dPtr * 0.85) * (0.40 + 0.60 * organicLace) * uRippleStrength * 0.52;

        float rawFoam = clamp(plungeBoil + plungeRings + shoreFoam + whitecap * 0.82 + ptrWake, 0.0, 1.0);
        float lacyFoam = smoothstep(0.10, 0.74, rawFoam);

        // Sunlit natural cream-white foam with cool sky shadow (strictly <= 0.86 linear)
        float foamLight = 0.56 + 0.44 * max(dot(N, uSunDir), 0.0);
        vec3 foamAlbedo = mix(vec3(0.44, 0.55, 0.64), vec3(0.84, 0.86, 0.87), foamLight);
        col = mix(col, foamAlbedo, lacyFoam * 0.92);

        // Feather rock-contact shoreline cleanly onto wet basalt & blend outer rim into horizon sky
        float shoreAlpha = smoothstep(-0.20, 0.04, vShoreDist);
        float outerRimFade = 1.0 - smoothstep(78.0, 93.0, length(vWorldPos.xz));
        col = applyAerialHaze(col, vWorldPos, cameraPosition, uSunDir, 0.0125);

        gl_FragColor = vec4(col, clamp((shoreAlpha + lacyFoam * 0.55) * outerRimFade, 0.0, 1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),X=new ut(C,F);X.frustumCulled=!1,X.renderOrder=2,n.add(X);function q(N){const Ae=new Float32Array(N.length*629*3),ee=new Float32Array(N.length*629*3),me=new Float32Array(N.length*629*2),Ce=new Float32Array(N.length*629*2),Ie=new Uint16Array(N.length*3456);let Me=0,Ye=0,ne=0,Se=0;for(let ae=0;ae<N.length;ae++){const V=N[ae],$=ae*629;for(let oe=0;oe<=36;oe++){const re=oe/36;let ye,We,Ne,Ee,Ge,Ze;if(V.isStream)ye=V.x0+(V.x1-V.x0)*re,Ne=-3.5+Math.sin((ye+6)*.45)*.16,We=za(ye,Ne)+.07,Ee=.14,Ge=.99,Ze=0;else{const Ue=re*V.fallTime;ye=V.x0+V.vx*Ue+V.layerOffset,We=V.y0+(V.vy0||0)*Ue-.5*9.81*Ue*Ue,Ne=V.z0+V.vz*Ue,Ee=-((V.vy0||0)-9.81*Ue),Ge=V.vx,Ze=0;const ie=1/Math.max(Math.hypot(Ee,Ge,Ze),1e-4);Ee*=ie,Ge*=ie}const rt=(V.w0+(V.w1-V.w0)*re)*.5,dt=V.isStream?1:pn(0,.22,re);for(let Ue=0;Ue<=16;Ue++){const ft=Ue/16,ie=(ft-.5)*2,He=Math.cos(ie*Math.PI*.5)*V.cup*dt;let ze=ye+Ee*He,Oe=We+Ge*He*.35;const et=Ne+ie*rt;if(V.isStream)Oe=We+.02*(1-ie*ie);else if(re>.18&&re<.72){const pt=za(ze,et);Oe<pt+.08&&(ze+=.15,Oe=Math.max(Oe,za(ze,et)+.06))}Ae[Me]=ze,Ae[Me+1]=Oe,Ae[Me+2]=et;const Mt=B(Ee,Ge,ie*.32);ee[Me]=Mt[0],ee[Me+1]=Mt[1],ee[Me+2]=Mt[2],Me+=3,me[Ye++]=ft,me[Ye++]=re,Ce[ne++]=V.phase,Ce[ne++]=V.mode}}for(let oe=0;oe<36;oe++)for(let re=0;re<16;re++){const ye=$+oe*17+re,We=ye+1,Ne=ye+17,Ee=Ne+1;Ie[Se++]=ye,Ie[Se++]=Ne,Ie[Se++]=We,Ie[Se++]=We,Ie[Se++]=Ne,Ie[Se++]=Ee}}const L=new st;return L.setAttribute("position",new De(Ae,3)),L.setAttribute("normal",new De(ee,3)),L.setAttribute("uv",new De(me,2)),L.setAttribute("aMeta",new De(Ce,2)),L.setIndex(new De(Ie,1)),L}function B(N,G,te){const O=Math.max(Math.hypot(N,G,te),1e-4);return[N/O,G/O,te/O]}const K=q([{isStream:!0,x0:-9.6,x1:-5.42,w0:.78,w1:.9,cup:.02,phase:.1,mode:0},{isStream:!1,x0:-5.54,y0:6.38,z0:-3.48,vx:1.42,vy0:-.14,vz:0,fallTime:.75,w0:.86,w1:1.28,cup:.09,layerOffset:0,phase:.25,mode:1},{isStream:!1,x0:-5.52,y0:6.4,z0:-3.48,vx:1.52,vy0:-.1,vz:0,fallTime:.76,w0:.94,w1:1.46,cup:.14,layerOffset:.03,phase:.62,mode:2},{isStream:!1,x0:-4.45,y0:3.66,z0:-3.5,vx:1.98,vy0:-.05,vz:0,fallTime:.32,w0:1.3,w1:1.46,cup:.06,layerOffset:.02,phase:.41,mode:1},{isStream:!1,x0:-3.82,y0:3.55,z0:-3.5,vx:1.31,vy0:-.12,vz:0,fallTime:.86,w0:1.26,w1:1.76,cup:.12,layerOffset:0,phase:0,mode:1},{isStream:!1,x0:-3.8,y0:3.59,z0:-3.5,vx:1.42,vy0:-.06,vz:0,fallTime:.87,w0:1.4,w1:2.05,cup:.2,layerOffset:.05,phase:.53,mode:2},{isStream:!1,x0:-4.02,y0:3.82,z0:-4.28,vx:1.08,vy0:-.1,vz:.12,fallTime:.88,w0:.34,w1:.66,cup:.06,layerOffset:.02,phase:.77,mode:2},{isStream:!1,x0:-4.06,y0:3.38,z0:-2.74,vx:1.15,vy0:-.08,vz:-.1,fallTime:.84,w0:.3,w1:.58,cup:.06,layerOffset:.02,phase:.33,mode:2}]),H=new Ke({uniforms:a,transparent:!0,depthWrite:!1,side:Bt,vertexShader:`
      ${je}
      ${on}
      attribute vec2 aMeta;

      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;

      varying vec2 vUv;
      varying vec2 vMeta;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        vUv = uv;
        vMeta = aMeta;

        vec3 p = position;
        if (aMeta.y > 0.5) {
          // Natural turbulent fluid-sheet flutter & storm-surge volume expansion
          float fallEnv = sin(clamp(uv.y, 0.0, 1.0) * 3.14159265);
          float turb = snoise(vec3(uv.x * 4.5, uv.y * 5.0 - uTime * 3.8, aMeta.x * 10.0));
          p += normal * (turb * 0.055 * fallEnv + 0.065 * uSurge * fallEnv);
          // Widen cataract slightly during surge
          p.z += (uv.x - 0.5) * 0.32 * uSurge * uv.y;
        }

        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = safeNorm3(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${on}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec3 uSunDir;

      varying vec2 vUv;
      varying vec2 vMeta;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        float phase = vMeta.x;
        float mode = vMeta.y;
        vec3 N = safeNorm3(vWorldNormal);
        vec3 V = safeNorm3(cameraPosition - vWorldPos);

        float speed = (2.35 + 0.45 * uIntensity + 0.65 * uSurge);
        // Because mesh V-coordinates are spaced by equal Newtonian fall time steps,
        // constant UV scrolling physically accelerates downward at 9.81 m/s^2!
        float scrollY = vUv.y * 4.2 - uTime * speed;

        // Multi-scale elongated falling water filaments & aerated whitewater chevrons
        float streakCoarse = ridgedFbm(vec3(vUv.x * 7.5, scrollY * 0.95, phase * 8.0 + uTime * 0.25));
        float streakFine = ridgedFbm(vec3(vUv.x * 18.0, scrollY * 1.65 - uTime * 0.6, phase * 13.0));
        float lace = smoothstep(0.15, 0.85, snoise(vec3(vUv.x * 24.0, scrollY * 2.6, uTime * 1.4 + phase * 6.0)) * 0.5 + 0.5);

        // Lateral jagged liquid ribbon edges (zero geometric polygon borders!)
        float edgeNoise = snoise(vec3(vUv.x * 6.0, scrollY * 1.4, phase * 5.0)) * 0.14;
        float widthMask = smoothstep(0.0, 0.22, vUv.x + edgeNoise * 0.5)
                        * smoothstep(0.0, 0.22, (1.0 - vUv.x) - edgeNoise * 0.5);

        // Aeration profile: dark glassy emerald-teal water inside the rock lip notch -> frothy whitewater over the brink
        float brinkRamp = smoothstep(0.02, 0.24, vUv.y);
        float aeration = mode < 0.5
          ? smoothstep(0.68, 1.0, vUv.y) * 0.48 + streakCoarse * 0.28
          : clamp(brinkRamp * 0.68 + (0.28 + 0.72 * brinkRamp) * (streakCoarse * 0.46 + streakFine * 0.32 + lace * 0.26), 0.0, 1.15);

        // Outdoor lighting: direct golden sun + translucent silver-gold forward scatter + cool sky shadow
        float sunFront = max(dot(N, uSunDir), 0.0);
        float sunTrans = safePow(clamp(dot(V, -uSunDir) * 0.5 + 0.5, 0.0, 1.0), 2.4);
        float fresnel = safePow(1.0 - abs(dot(N, V)), 3.0);

        vec3 glassyStream = vec3(0.026, 0.20, 0.25);
        vec3 shadowedFoam = vec3(0.42, 0.52, 0.61);
        vec3 sunlitWhitewater = vec3(0.86, 0.87, 0.86) + vec3(0.10, 0.06, 0.01) * (sunFront + sunTrans * 0.5);

        vec3 foamTone = mix(shadowedFoam, sunlitWhitewater, clamp(0.48 + 0.52 * sunFront + 0.28 * sunTrans, 0.0, 1.0));
        vec3 col = mix(glassyStream, foamTone, clamp(aeration, 0.0, 1.0));
        col += vec3(0.75, 0.78, 0.82) * fresnel * 0.18;

        float endFeather = mode < 0.5
          ? smoothstep(0.0, 0.14, vUv.y) * (1.0 - smoothstep(0.86, 1.0, vUv.y) * 0.35)
          : smoothstep(0.0, 0.09, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y) * 0.45);

        float density = mode > 1.5
          ? (0.22 + 0.52 * streakFine * lace)
          : (0.52 + 0.44 * clamp(streakCoarse + streakFine * 0.5, 0.0, 1.0));

        float alpha = widthMask * endFeather * density * (0.88 + 0.22 * uSurge);
        if (alpha < 0.015) discard;

        col = applyAerialHaze(col, vWorldPos, cameraPosition, uSunDir, 0.012);
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.93));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),se=new ut(K,H);se.frustumCulled=!1,se.renderOrder=4,n.add(se);const ue=2200,de=new st,_e=new Float32Array(ue*3),Re=new Float32Array(ue*4),j=new Float32Array(ue*2);for(let N=0;N<ue;N++){const G=N%5;if(G<3){const te=Math.random()*Math.PI*2,O=Math.random()*.92;_e[N*3+0]=i.x+Math.cos(te)*O,_e[N*3+1]=.08+Math.random()*.18,_e[N*3+2]=i.y+Math.sin(te)*O*1.15;const he=.65+Math.random()*2.15;Re[N*4+0]=Math.cos(te)*he+.38,Re[N*4+1]=2.1+Math.random()*3.4,Re[N*4+2]=Math.sin(te)*he,j[N*2+1]=.65+Math.random()*.48}else if(G===3){const te=(Math.random()-.5)*1.35;_e[N*3+0]=-4.25+(Math.random()-.5)*.35,_e[N*3+1]=3.62+Math.random()*.2,_e[N*3+2]=-3.5+te,Re[N*4+0]=1.15+Math.random()*1.65,Re[N*4+1]=.75+Math.random()*1.85,Re[N*4+2]=te*.65+(Math.random()-.5)*.9,j[N*2+1]=.95+Math.random()*.32}else{const te=N%2===0,O=(N%4<2?-1:1)*(.45+Math.random()*.42);_e[N*3+0]=te?-5.44:-3.75,_e[N*3+1]=te?6.28:3.46,_e[N*3+2]=-3.5+O,Re[N*4+0]=1.35+Math.random()*.65,Re[N*4+1]=-.25+Math.random()*.55,Re[N*4+2]=O*(.35+Math.random()*.45),j[N*2+1]=.82+Math.random()*.22}Re[N*4+3]=Math.random(),j[N*2+0]=2+Math.pow(Math.random(),2.2)*3.6}de.setAttribute("position",new De(_e,3)),de.setAttribute("aVel",new De(Re,4)),de.setAttribute("aMeta",new De(j,2));const le=new Ke({uniforms:a,transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
      ${on}
      attribute vec4 aVel;
      attribute vec2 aMeta;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uPixelRatio;
      uniform float uViewportScale;

      varying float vAlpha;

      void main() {
        float dur = aMeta.y;
        float rate = (1.0 / dur) * (0.92 + 0.14 * uIntensity + 0.22 * uSurge);
        float life = fract(aVel.w + uTime * rate);
        float t = life * dur;

        float boost = 0.94 + 0.12 * uIntensity + 0.28 * uSurge;
        vec3 windAcc = vec3(0.45 + 0.4 * uIntensity, -9.81, 0.22);

        vec3 p = position + aVel.xyz * boost * t + 0.5 * windAcc * t * t;
        // Fade cleanly upon re-entering sea level
        float aboveSea = smoothstep(-0.08, 0.06, p.y);
        p.y = max(p.y, -0.05);

        vAlpha = sin(clamp(life, 0.0, 1.0) * 3.14159265) * aboveSea;

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        float pScale = uPixelRatio * uViewportScale;
        gl_PointSize = min(aMeta.x * pScale * (11.0 / max(-mvPos.z, 1.5)), 24.0 * pScale);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5 || vAlpha < 0.01) discard;

        // Crisp sunlit water droplet with tiny specular highlight
        float drop = exp(-d * d * 22.0);
        vec2 hl = uv - vec2(-0.12, -0.12);
        float glint = exp(-dot(hl, hl) * 75.0);
        vec3 col = mix(vec3(0.68, 0.77, 0.84), vec3(0.96, 0.94, 0.88), glint);
        gl_FragColor = vec4(col, clamp((drop * 0.72 + glint * 0.35) * vAlpha, 0.0, 0.85));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),Te=new Vn(de,le);Te.frustumCulled=!1,Te.renderOrder=6,n.add(Te);const fe=700,we=new st,ve=new Float32Array(fe*3),qe=new Float32Array(fe*4),Je=new Float32Array(fe),$e=[[-1.15,-1.15,.92],[-3.55,1.15,1.15],[-1.92,2.38,.85],[.65,-5.75,1.08],[-2.55,-2.1,1.1],[-2.35,.25,1.15],[-2.05,2.75,1.05],[-1.85,-5.65,1.15]];for(let N=0;N<fe;N++){const G=$e[N%$e.length],te=Math.random()*Math.PI*2,O=(.45+Math.random()*.65)*G[2];ve[N*3+0]=G[0]+Math.cos(te)*O,ve[N*3+1]=.14+Math.random()*.22,ve[N*3+2]=G[1]+Math.sin(te)*O;const he=.55+Math.random()*1.45;qe[N*4+0]=Math.cos(te)*he-.25,qe[N*4+1]=1.65+Math.random()*2.35,qe[N*4+2]=Math.sin(te)*he+.42,qe[N*4+3]=Math.random(),Je[N]=1.9+Math.pow(Math.random(),2)*3.4}we.setAttribute("position",new De(ve,3)),we.setAttribute("aVel",new De(qe,4)),we.setAttribute("aSize",new De(Je,1));const Qe=new Ke({uniforms:a,transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
      ${on}
      attribute vec4 aVel;
      attribute float aSize;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uPixelRatio;
      uniform float uViewportScale;

      varying float vAlpha;

      void main() {
        float life = fract(aVel.w + uTime * (1.15 + 0.25 * uSurge));
        float t = life * 0.72;

        // Synchronise surf bursts with incoming Gerstner swell arrival phase!
        float waveArrival = sin(dot(position.xz, vec2(-0.46, 0.58)) - uTime * 2.25);
        float burstMask = smoothstep(0.05, 0.78, waveArrival + 0.35 * uSurge);

        float boost = 0.88 + 0.18 * uIntensity + 0.42 * uSurge;
        vec3 p = position + aVel.xyz * boost * t + 0.5 * vec3(0.3, -9.81, 0.35) * t * t;
        float aboveSea = smoothstep(-0.05, 0.06, p.y);

        vAlpha = sin(clamp(life, 0.0, 1.0) * 3.14159265) * burstMask * aboveSea;

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        float pScale = uPixelRatio * uViewportScale;
        gl_PointSize = min(aSize * pScale * (10.5 / max(-mvPos.z, 1.5)), 22.0 * pScale);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5 || vAlpha < 0.01) discard;
        float drop = exp(-d * d * 24.0);
        gl_FragColor = vec4(vec3(0.84, 0.88, 0.90), drop * vAlpha * 0.76);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),z=new Vn(we,Qe);z.frustumCulled=!1,z.renderOrder=6,n.add(z);const nt=1300,be=new st,J=new Float32Array(nt*3),ce=new Float32Array(nt*4),ge=new Float32Array(nt*3);for(let N=0;N<nt;N++){const G=N%20,te=Math.random()*Math.PI*2;if(G<8){const O=Math.pow(Math.random(),.65)*2.15;J[N*3+0]=i.x+.45+Math.cos(te)*O*1.15,J[N*3+1]=.06+Math.random()*.34,J[N*3+2]=i.y+Math.sin(te)*O*1.25,ce[N*4+0]=.65+Math.random()*2.25,ce[N*4+1]=.05+Math.random()*.38,ce[N*4+2]=(Math.random()-.42)*2.65,ge[N*3+1]=18+Math.random()*34}else if(G<14){const O=Math.random(),he=.35+O*5.8,Ae=-2.75-O*2.75+(Math.random()-.5)*.45;J[N*3+0]=Ae,J[N*3+1]=he,J[N*3+2]=-3.5+(Math.random()-.5)*2.1,ce[N*4+0]=.35+Math.random()*1.65,ce[N*4+1]=-.35+Math.random()*1.15,ce[N*4+2]=(Math.random()-.45)*2.5,ge[N*3+1]=14+Math.random()*28}else if(G<17)J[N*3+0]=-4.65+Math.random()*1.55,J[N*3+1]=1.65+Math.random()*3.65,J[N*3+2]=-3.5+(Math.random()-.45)*3.6,ce[N*4+0]=.25+Math.random()*1.35,ce[N*4+1]=.2+Math.random()*1.1,ce[N*4+2]=(Math.random()-.48)*2.9,ge[N*3+1]=16+Math.random()*30;else{const O=-6.2+Math.random()*9.2;J[N*3+0]=-2.45+Math.sin(O*.5)*.65+Math.random()*1.45,J[N*3+1]=.08+Math.random()*.48,J[N*3+2]=O,ce[N*4+0]=.2+Math.random()*1.15,ce[N*4+1]=.12+Math.random()*.52,ce[N*4+2]=.35+Math.random()*1.65,ge[N*3+1]=15+Math.random()*26}ce[N*4+3]=Math.random(),ge[N*3+0]=.11+Math.random()*.16,ge[N*3+2]=Math.random()*Math.PI*2}be.setAttribute("position",new De(J,3)),be.setAttribute("aDrift",new De(ce,4)),be.setAttribute("aMeta",new De(ge,3));const pe=new Ke({uniforms:a,transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
      ${je}
      ${on}
      attribute vec4 aDrift;
      attribute vec3 aMeta;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uPixelRatio;
      uniform float uViewportScale;

      varying float vLife;
      varying float vSeed;
      varying vec3 vWorldPos;

      void main() {
        float life = fract(aDrift.w + uTime * aMeta.x * (0.85 + 0.25 * uIntensity + 0.35 * uSurge));
        vLife = life;
        vSeed = aMeta.z;

        // Per-puff individualized 3D coastal eddy trajectory + 3D simplex curl turbulence
        float breeze = 0.92 + 0.32 * uIntensity + 0.52 * uSurge;
        vec3 baseMove = aDrift.xyz * (life * breeze);

        vec3 nCoord = position * 0.48 + vec3(-uTime * 0.16, uTime * 0.14, aMeta.z);
        vec3 curlEddy = vec3(
          snoise(nCoord),
          snoise(nCoord + vec3(5.2, -3.1, 2.7)) * 0.65,
          snoise(nCoord + vec3(-4.4, 6.1, -1.9))
        ) * (0.35 + 0.85 * life);

        vec3 p = position + baseMove + curlEddy;
        p.y = max(p.y, 0.04);

        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorldPos = wp.xyz;

        vec4 mvPos = viewMatrix * wp;
        float expand = 0.52 + 0.92 * life;
        float pScale = uPixelRatio * uViewportScale;
        gl_PointSize = min(aMeta.y * expand * pScale * (11.0 / max(-mvPos.z, 2.2)), 74.0 * pScale);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      ${je}
      ${on}
      uniform float uTime;
      uniform float uSurge;
      uniform vec3 uSunDir;

      varying float vLife;
      varying float vSeed;
      varying vec3 vWorldPos;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;

        // Rotate, stretch & domain-warp each sprite so mist forms irregular sunlit wisps, never ovals!
        float ca = cos(vSeed + vLife * 0.95);
        float sa = sin(vSeed + vLife * 0.95);
        vec2 rUv = mat2(ca, -sa, sa, ca) * uv;
        rUv.x *= 0.82;
        rUv.y *= 1.24;

        vec2 uWarp = vec2(
          snoise(vec3(rUv * 2.8, vSeed * 1.7 + uTime * 0.16)),
          snoise(vec3(rUv * 2.8 + vec2(3.7, -2.3), vSeed * 1.7 - uTime * 0.14))
        ) * 0.22;

        float wisp = fbm4(vec3((rUv + uWarp) * 4.2, vSeed * 2.5 + uTime * 0.20)) * 0.5 + 0.5;
        float wispMask = smoothstep(0.26, 0.78, wisp);
        float radialMask = smoothstep(0.49, 0.10, d + (wisp - 0.5) * 0.28);
        float lifeEnv = smoothstep(0.0, 0.24, vLife) * (1.0 - smoothstep(0.42, 1.0, vLife));

        // Sunlit warm ivory mist top + cool coastal sea-shadow belly
        vec3 V = safeNorm3(cameraPosition - vWorldPos);
        float mieScatter = safePow(clamp(dot(V, -uSunDir) * 0.5 + 0.5, 0.0, 1.0), 2.2);
        float verticalGrad = clamp(0.55 - uv.y * 0.9, 0.0, 1.0);

        vec3 shadowMist = vec3(0.46, 0.57, 0.67);
        vec3 sunlitMist = vec3(0.90, 0.87, 0.82) + vec3(0.08, 0.05, 0.01) * mieScatter;
        vec3 col = mix(shadowMist, sunlitMist, clamp(verticalGrad * 0.72 + mieScatter * 0.35, 0.0, 1.0));

        float alpha = radialMask * wispMask * lifeEnv * (0.034 + 0.022 * uSurge);
        if (alpha < 0.003) discard;

        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),R=new Vn(be,pe);R.frustumCulled=!1,R.renderOrder=5,n.add(R);let b=0,k=0;const Q=new Le(0,0);return{name:"water",title:"Water · Coastal Waterfall Cove",subtitle:"Sunlit Basalt Sea Cliffs, Plunging Cataract & Rolling Ocean Swells",description:"A raw outdoor coastal cove where an upland stream plunges down stratified wet basalt cliffs into a frothy turquoise-to-navy ocean, driven by a 6-wave directional Gerstner swell spectrum, Schlick Fresnel sky reflection, sunlit wave-crest subsurface scattering, and 4,200 Newtonian spray and mist particles.",stats:"4,200 Particles · 272×272 Gerstner Ocean · Newtonian Waterfall",accent:"#28c6f7",scene:n,defaultCamera:{position:new D(5.6,3.5,11.4),target:new D(-1.1,2,-3),fov:46,minDistance:3.5,maxDistance:28,maxPolarAngle:Math.PI*.48},particleCount:ue+fe+nt,update(N,G,te,O=null){const he=Math.min(Math.max(N-b,.001),.05);b=N,a.uTime.value=N,a.uIntensity.value=G,a.uSurge.value=te,a.uViewportScale.value=O?.activeView==="all"?.52:1;let Ae=0;if(O&&O.pointerActive&&O.pointerWorld){const me=O.pointerWorld.x,Ce=O.pointerWorld.z;Math.hypot(me,Ce)<42&&(Q.set(me,Ce),Ae=1)}const ee=1-Math.exp(-he*5.5);k+=(Ae-k)*ee,a.uRippleStrength.value=k,a.uPointerActive.value=Ae,Ae>0&&a.uPointerXZ.value.lerp(Q,Math.min(1,he*12))},onResize(N){a.uPixelRatio.value=N}}}function la(n){let e=n>>>0;return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function qa(n,e,t){const i=Math.max(0,Math.min(1,(t-n)/(e-n)));return i*i*(3-2*i)}function fn(n){return Math.sin(n*.082+.45)*2.35+Math.cos(n*.036-.65)*1.35-.35}function zs(n){const e=Math.max(0,-n+14)*.021,t=Math.sin(n*.045+.3)*.12;return e+t}function Tv(n,e){let t=0;return t+=Math.sin(n*.095+e*.062+.7)*Math.cos(e*.084-n*.051)*.85,t+=Math.sin(n*.21-e*.17+2.1)*Math.cos(n*.14+e*.23)*.38,t+=Math.sin(n*.43+e*.39-1.2)*.14,t+=Math.cos(n*.82-e*.74+.5)*.05,t}function ln(n,e){const t=fn(e),i=Math.abs(n-t),a=zs(e),r=qa(1.15,4.4,i),o=Math.abs(n),s=Math.pow(Math.min(o/23.5,2.4),1.72)*3.65,l=Math.pow(Math.max(0,-e-22)/36,1.65)*4.8,c=(Tv(n,e)+.35)*(.22+.78*r),f=(1-qa(.32,1.82,i))*.54;return a+(s+l+c)*r-f}function Av(n,e,t=new D){const a=ln(n-.22,e),r=ln(n+.22,e),o=ln(n,e-.22),s=ln(n,e+.22);return t.set(a-r,2*.22,o-s).normalize()}function Ho(n){if(n.length===0)return new st;const e=Object.keys(n[0].attributes),t=new st;for(const i of e){const a=n[0].attributes[i].itemSize;let r=0;for(const l of n)r+=l.attributes[i].array.length;const o=new Float32Array(r);let s=0;for(const l of n){const c=l.attributes[i].array;o.set(c,s),s+=c.length}t.setAttribute(i,new De(o,a))}return t}const kt=`
float spow(float x, float y) {
  return x <= 1e-6 ? 0.0 : pow(max(x, 1e-6), y);
}

vec3 safeNorm(vec3 v) {
  float l2 = dot(v, v);
  return l2 > 1e-10 ? v * inversesqrt(l2) : vec3(0.0, 1.0, 0.0);
}

vec2 safeNorm2(vec2 v) {
  float l2 = dot(v, v);
  return l2 > 1e-10 ? v * inversesqrt(l2) : vec2(1.0, 0.0);
}

// Travelling 2D valley Perlin/Simplex wind-wave field + sweeping surge gust
vec2 computeValleyWind(vec2 worldXZ, float time, float windPhase, float intensity, float surge) {
  vec2 mainDir = vec2(0.79, 0.613); // Morning breeze sweeping diagonally across valley
  vec2 crossDir = vec2(-0.613, 0.79);

  float phase = dot(worldXZ, mainDir) * 0.34 - windPhase;

  // Travelling wave trains + natural gust pockets
  float wave1 = sin(phase) * 0.5 + 0.5;
  float wave2 = sin(phase * 1.85 + dot(worldXZ, crossDir) * 0.22 - windPhase * 0.48) * 0.5 + 0.5;
  float gustNoise = snoise(vec3(worldXZ * 0.095 - mainDir * windPhase * 0.22, time * 0.22)) * 0.5 + 0.5;
  float detailTurb = snoise(vec3(worldXZ * 0.36 - mainDir * windPhase * 0.48, time * 0.55));

  float baseMag = (0.24 + 0.58 * wave1 * gustNoise + 0.22 * wave2) * (0.55 + 0.62 * intensity);

  // Sweeping golden surge gale rolling visibly across the entire valley
  float surgeFront = sin(dot(worldXZ, mainDir) * 0.24 - windPhase * 1.65) * 0.5 + 0.5;
  float surgeMag = surge * (0.95 + 0.65 * surgeFront);

  float totalMag = baseMag + surgeMag;
  vec2 dirJitter = mainDir + crossDir * (detailTurb * 0.26);
  return safeNorm2(dirJitter) * totalMag;
}

// 3-stop golden-hour Rayleigh + Mie aerial perspective (avoids blue+orange grey cancellation!)
vec3 applyMorningAerialHaze(vec3 col, vec3 worldPos, vec3 camPos, vec3 sunDir, float surge) {
  vec3 toFrag = worldPos - camPos;
  float dist = length(toFrag);
  vec3 viewDir = dist > 1e-4 ? toFrag / dist : vec3(0.0, 0.0, -1.0);

  float sunAlign = clamp(dot(viewDir, sunDir), 0.0, 1.0);
  float heightAtten = exp(-max(worldPos.y, 0.0) * 0.052);
  float fogFactor = (1.0 - exp(-dist * 0.0056 * (0.58 + 0.42 * heightAtten)));
  fogFactor = clamp(fogFactor, 0.0, 0.84);

  vec3 coolShadowHaze = vec3(0.30, 0.48, 0.70);
  vec3 warmChampagneMist = vec3(0.76, 0.68, 0.54);
  vec3 goldenPassGlow = vec3(0.94, 0.74, 0.44);

  float warmT = smoothstep(0.15, 0.72, sunAlign);
  float goldT = spow(sunAlign, 2.6) * 0.82 + 0.10 * surge;
  vec3 hazeCol = mix(coolShadowHaze, warmChampagneMist, warmT);
  hazeCol = mix(hazeCol, goldenPassGlow, clamp(goldT, 0.0, 0.92));

  return mix(col, hazeCol, fogFactor);
}
`;function Ev(n){const e=n.attributes.position,t=e.count,i=new Float32Array(t*3),a=new Map,r=new Array(t);for(let h=0;h<t;h++){const p=Math.round(e.getX(h)*8192),g=Math.round(e.getY(h)*8192),x=Math.round(e.getZ(h)*8192),m=`${p},${g},${x}`;r[h]=m,a.has(m)||a.set(m,[0,0,0])}const o=new D,s=new D,l=new D,c=new D,f=new D,d=new D;for(let h=0;h<t;h+=3){o.fromBufferAttribute(e,h),s.fromBufferAttribute(e,h+1),l.fromBufferAttribute(e,h+2),c.subVectors(s,o),f.subVectors(l,o),d.crossVectors(c,f);for(let p=0;p<3;p++){const g=a.get(r[h+p]);g[0]+=d.x,g[1]+=d.y,g[2]+=d.z}}for(let h=0;h<t;h++){const p=a.get(r[h]),g=Math.hypot(p[0],p[1],p[2])||1;i[h*3+0]=p[0]/g,i[h*3+1]=p[1]/g,i[h*3+2]=p[2]/g}n.setAttribute("normal",new De(i,3))}function Cv(n){const e=n.attributes.position,t=e.count,i=t/3,a=new Float32Array(t*3),r=new Map,o=new Array(t);for(let x=0;x<t;x++){const m=Math.round(e.getX(x)*8192),u=Math.round(e.getY(x)*8192),M=Math.round(e.getZ(x)*8192),S=`${m},${u},${M}`;o[x]=S;let v=r.get(S);v||(v=[],r.set(S,v)),v.push(x/3|0)}const s=new Float32Array(i*3),l=new Float32Array(i*3),c=new D,f=new D,d=new D,h=new D,p=new D,g=new D;for(let x=0;x<i;x++){const m=x*3;c.fromBufferAttribute(e,m),f.fromBufferAttribute(e,m+1),d.fromBufferAttribute(e,m+2),h.subVectors(f,c),p.subVectors(d,c),g.crossVectors(h,p),l[x*3+0]=g.x,l[x*3+1]=g.y,l[x*3+2]=g.z;const u=g.length()||1;s[x*3+0]=g.x/u,s[x*3+1]=g.y/u,s[x*3+2]=g.z/u}for(let x=0;x<t;x++){const m=x/3|0,u=s[m*3+0],M=s[m*3+1],S=s[m*3+2];let v=0,T=0,w=0;const E=r.get(o[x]);for(let y=0;y<E.length;y++){const _=E[y];let P=1;if(_!==m){const I=u*s[_*3+0]+M*s[_*3+1]+S*s[_*3+2];P=I>.42?Math.pow((I-.42)/.58,2.2):0}P>0&&(v+=l[_*3+0]*P,T+=l[_*3+1]*P,w+=l[_*3+2]*P)}const C=Math.hypot(v,T,w);C>1e-8?(a[x*3+0]=v/C,a[x*3+1]=T/C,a[x*3+2]=w/C):(a[x*3+0]=u,a[x*3+1]=M,a[x*3+2]=S)}n.setAttribute("normal",new De(a,3))}function Pv(n,e,t,i,a=4){const r=new io(1,a),o=r.index?r.toNonIndexed():r,s=o.attributes.position,l=la(i),c=[];for(let x=0;x<14;x++){const m=x/14*Math.PI*2+(l()-.5)*.55,u=x<4?.55+l()*.4:(l()*2-1)*.78,M=new D(Math.cos(m)*Math.sqrt(Math.max(.05,1-u*u)),u,Math.sin(m)*Math.sqrt(Math.max(.05,1-u*u))).normalize();c.push({dir:M,dist:.56+l()*.28})}const f=l()*6.28,d=l()*6.28,h=l()*6.28,p=new D;for(let x=0;x<s.count;x++){p.fromBufferAttribute(s,x);for(const T of c){const E=p.dot(T.dir)-T.dist,C=.034;if(E>-C){const y=E>C?E:(E+C)*(E+C)/(4*C);p.addScaledVector(T.dir,-y*.92)}}const m=1-Math.abs(Math.sin(p.x*2.35+p.y*1.45-p.z*1.85+f)),u=1-Math.abs(Math.sin(p.z*2.65-p.x*1.95+p.y*1.25+d)),M=Math.sin(p.x*4.4+p.z*3.9-p.y*3.1+h),S=m*m*.075+u*u*.055-.052+M*.018,v=p.clone().normalize();p.addScaledVector(v,S),p.y<-.34&&(p.y=-.34+(p.y+.34)*.42),p.set(p.x*n,p.y*e,p.z*t),s.setXYZ(x,p.x,p.y,p.z)}Cv(o);const g=new Float32Array(s.count/3*6);return o.setAttribute("uv",new De(g,2)),o}function Ac(n,e,t,i,a,r){const o=la(r),s=o()*10,l=o()*10,c=[],f=[];function d(p,g){const x=p*Math.PI*2,m=Math.cos(x),u=Math.sin(x),M=Math.atan2(-.897,.35);let S=Math.atan2(Math.sin(x-M),Math.cos(x-M));const v=1-.36*Math.exp(-(S*S)/.16),T=Math.abs(Math.sin(m*2.7+u*2.3+s)*Math.cos(u*3.1-m*1.9+l)),w=Math.abs(Math.sin(m*6.4-u*5.8+l)*.5+Math.cos(m*9.1+u*7.7)*.5),E=Math.abs(Math.sin(x*13+s*2))*.25,C=Math.pow(Math.max(.05,1-Math.abs(g-.58)*1.95),1.35),y=qa(0,.16,g)*qa(1,.86,g);return(.36+.58*T+.34*w+.18*E)*t*C*y*v-1.5*(1-y)}for(let p=0;p<i;p++){const g=p/i,x=(p+1)/i,m=g*Math.PI*2,u=x*Math.PI*2;for(let M=0;M<a;M++){const S=M/a,v=(M+1)/a,T=n+(e-n)*S,w=n+(e-n)*v,E=[Math.cos(m)*T,d(g,S),Math.sin(m)*T],C=[Math.cos(u)*T,d(x,S),Math.sin(u)*T],y=[Math.cos(m)*w,d(g,v),Math.sin(m)*w],_=[Math.cos(u)*w,d(x,v),Math.sin(u)*w];c.push(...E,...y,...C),f.push(g,S,g,v,x,S),c.push(...C,...y,..._),f.push(x,S,g,v,x,v)}}const h=new st;return h.setAttribute("position",new ct(c,3)),h.setAttribute("uv",new ct(f,2)),h.computeVertexNormals(),h}function Rv(n=5){const e=[],t=[],i=[];for(let o=0;o<n;o++){const s=o/n,l=(o+1)/n,c=.032*(1-Math.pow(s,1.35)),f=o===n-1?0:.032*(1-Math.pow(l,1.35)),d=s*s*.18,h=l*l*.18,p=c*.28,g=f*.28,x=[-c,s,d+p],m=[0,s,d],u=[c,s,d+p],M=[-f,l,h+g],S=[0,l,h],v=[f,l,h+g],T=new D(-.35,.15,.92).normalize(),w=new D(.35,.15,.92).normalize();if(o===n-1)e.push(...x,...m,...S),t.push(T.x,T.y,T.z,T.x,T.y,T.z,0,.2,.98),i.push(0,s,.5,s,.5,1),e.push(...m,...u,...S),t.push(w.x,w.y,w.z,w.x,w.y,w.z,0,.2,.98),i.push(.5,s,1,s,.5,1);else{e.push(...x,...m,...M,...m,...S,...M);for(let E=0;E<6;E++)t.push(T.x,T.y,T.z);i.push(0,s,.5,s,0,l,.5,s,.5,l,0,l),e.push(...m,...u,...S,...u,...v,...S);for(let E=0;E<6;E++)t.push(w.x,w.y,w.z);i.push(.5,s,1,s,.5,l,1,s,1,l,.5,l)}}const r=new st;return r.setAttribute("position",new ct(e,3)),r.setAttribute("normal",new ct(t,3)),r.setAttribute("uv",new ct(i,2)),r}function Dv(){const n=[],e=[],t=[];for(let c=0;c<3;c++){const f=c/3*Math.PI*2,d=(c+1)/3*Math.PI*2,h=Math.cos(f)*.009,p=Math.sin(f)*.009,g=Math.cos(d)*.009,x=Math.sin(d)*.009,m=Math.cos((f+d)*.5),u=Math.sin((f+d)*.5);n.push(h,0,p,g,0,x,h*.7,.42,p*.7),n.push(g,0,x,g*.7,.42,x*.7,h*.7,.42,p*.7);for(let M=0;M<6;M++)e.push(m,.1,u);t.push(0,0,0,0,0,.85,0,0,0,.85,0,.85)}const r=5,o=.075,s=.036;for(let c=0;c<r;c++){const f=c/r*Math.PI*2,d=Math.cos(f),h=Math.sin(f),p=-h,g=d,x=[0,.42,0],m=[d*o*.55-p*s,.42+.018,h*o*.55-g*s],u=[d*o*.55+p*s,.42+.018,h*o*.55+g*s],M=[d*o,.42+.028,h*o];n.push(...x,...m,...u,...m,...M,...u);for(let S=0;S<6;S++)e.push(d*.25,.94,h*.25);t.push(1,.9,1,.96,1,.96,1,.96,1,1,1,.96)}const l=new st;return l.setAttribute("position",new ct(n,3)),l.setAttribute("normal",new ct(e,3)),l.setAttribute("uv",new ct(t,2)),l}function Lv(n,e,t){const i=la(t),a=[],r=[];function o(l,c,f,d,h,p,g){const x=p===0?7:p===1?5:4,m=p===0?8:p===1?6:5,u=[l.clone()],M=c.clone().normalize(),S=l.clone();for(let q=1;q<=x;q++){const B=q/x,K=f/x;M.x+=(i()-.5)*.26,M.z+=(i()-.5)*.26,M.y+=p===0?.04:.08*B,M.normalize(),S.addScaledVector(M,K),u.push(S.clone())}const v=[],T=[],w=[],E=[],C=new D(0,1,0),y=new D,_=new D,P=[];for(let q=0;q<=x;q++){const B=q/x,K=u[q],H=q<x?u[q+1].clone().sub(K).normalize():K.clone().sub(u[q-1]).normalize();Math.abs(H.y)>.95?C.set(1,0,0):C.set(0,1,0),y.crossVectors(H,C).normalize(),_.crossVectors(y,H).normalize();const se=p===0&&B<.25?Math.pow(1-B/.25,2)*.55:0,ue=d+(h-d)*B,de=[];for(let _e=0;_e<=m;_e++){const Re=_e/m*Math.PI*2,j=p===0?1+se*(.6+.4*Math.sin(Re*4+t)):1,le=ue*j,Te=y.clone().multiplyScalar(Math.cos(Re)).addScaledVector(_,Math.sin(Re)),fe=K.clone().addScaledVector(Te,le);de.push({pos:fe,norm:Te,u:_e/m,v:B+p*.8,hRel:Math.max(0,(fe.y-n.y)/(4.8*e))})}P.push(de)}for(let q=0;q<x;q++)for(let B=0;B<m;B++){const K=P[q][B],H=P[q][B+1],se=P[q+1][B],ue=P[q+1][B+1];for(const de of[K,se,H,H,se,ue])v.push(de.pos.x,de.pos.y,de.pos.z),T.push(de.norm.x,de.norm.y,de.norm.z),w.push(de.u,de.v),E.push(de.hRel)}const I=new st;I.setAttribute("position",new ct(v,3)),I.setAttribute("normal",new ct(T,3)),I.setAttribute("uv",new ct(w,2)),I.setAttribute("aSway",new ct(E,1)),a.push(I);const F=u[u.length-1];if(p>=g){const q=10+Math.floor(i()*6);for(let B=0;B<q;B++){const K=(.35+i()*.72)*e,H=i()*Math.PI*2,se=Math.acos(i()*1.5-.5),ue=F.x+Math.sin(se)*Math.cos(H)*K,de=F.y+Math.cos(se)*K*.68+.12*e,_e=F.z+Math.sin(se)*Math.sin(H)*K;r.push({pos:new D(ue,de,_e),crownCenter:new D(n.x,n.y+3.6*e,n.z),size:(.62+i()*.48)*e,seed:i(),sway:Math.max(.15,(de-n.y)/(4.8*e))})}return}const X=p===0?4:p===1?3:2;for(let q=0;q<X;q++){const B=p===0?.68+q/X*.3:.72+i()*.28,K=Math.min(x,Math.max(1,Math.round(B*x))),H=u[K].clone(),se=q/X*Math.PI*2+i()*.85+p*1.3,ue=p===0?.58+i()*.28:.48+i()*.36,de=new D(M.x*.45+Math.cos(se)*ue,Math.max(.18,M.y*.65+(.28+i()*.25)),M.z*.45+Math.sin(se)*ue).normalize();o(H,de,f*(.64+i()*.14),h*1.05,h*.52,p+1,g)}}const s=new D((i()-.5)*.18,1,(i()-.5)*.18).normalize();return o(new D(n.x,n.y-.18,n.z),s,2.15*e,.3*e,.16*e,0,3),{branchGeos:a,leafAnchors:r}}function Nv(){const n=[],e=[],t=[];for(let a=0;a<3;a++){const r=a/3*Math.PI+.22,o=(a-1)*.38,s=Math.cos(r),l=Math.sin(r),c=.52,f=.48,d=.12,h=[[-c,-f,d],[c,-f,d],[-c,f,-d*.5],[c,f,-d*.5],[0,0,-d*.6]].map(([m,u,M])=>{const S=u*Math.cos(o)-M*Math.sin(o),v=u*Math.sin(o)+M*Math.cos(o);return[m*s+v*l,S,-m*l+v*s]}),p=new D(Math.sin(o)*l,Math.cos(o)*.65+.35,Math.cos(o)*s).normalize(),g=[[0,0],[1,0],[0,1],[1,1],[.5,.5]],x=[[0,1,4],[1,3,4],[3,2,4],[2,0,4]];for(const[m,u,M]of x){n.push(...h[m],...h[u],...h[M]);for(let S=0;S<3;S++)e.push(p.x,p.y,p.z);t.push(...g[m],...g[u],...g[M])}}const i=new st;return i.setAttribute("position",new ct(n,3)),i.setAttribute("normal",new ct(e,3)),i.setAttribute("uv",new ct(t,2)),i}function Fv(){const i=[],a=[];function r(s,l){const c=Math.sin(Math.pow(l,.72)*Math.PI)*(1-.18*l),f=s*.046*c,d=(l-.5)*.15,h=Math.sin(l*Math.PI)*.022-l*l*.016+Math.abs(s)*c*.014;return[f,d,h]}for(let s=0;s<5;s++){const l=s/5,c=(s+1)/5,f=r(-1,l),d=r(0,l),h=r(1,l),p=r(-1,c),g=r(0,c),x=r(1,c);i.push(...f,...d,...p,...d,...g,...p),a.push(0,l,.5,l,0,c,.5,l,.5,c,0,c),i.push(...d,...h,...g,...h,...x,...g),a.push(.5,l,1,l,.5,c,1,l,1,c,.5,c)}const o=new st;return o.setAttribute("position",new ct(i,3)),o.setAttribute("uv",new ct(a,2)),Ev(o),o}function Iv(){const n=new Ka;n.background=new lt(6128299);const e=new D(.35,.27,-.897).normalize(),t={uTime:{value:0},uWindPhase:{value:0},uLeafTime:{value:0},uStreamFlow:{value:0},uIntensity:{value:1},uSurge:{value:0},uPixelRatio:{value:Math.min(window.devicePixelRatio||1,2)},uViewScale:{value:.5},uSunDir:{value:e.clone()},uPointer:{value:new wt(0,0,0,0)}},i=new ao(9091307,3886379,.85);n.add(i);const a=new ro(16770229,1.35);a.position.copy(e).multiplyScalar(60),n.add(a);const r=new Ke({uniforms:t,side:Lt,depthWrite:!1,vertexShader:`
      varying vec3 vWorldDir;
      void main() {
        vWorldDir = position;
        vec4 wp = vec4(cameraPosition + position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uTime;
      uniform float uSurge;
      uniform vec3 uSunDir;
      varying vec3 vWorldDir;

      void main() {
        vec3 dir = safeNorm(vWorldDir);
        float mu = dot(dir, uSunDir);
        float sunPos = max(mu, 0.0);
        float y = max(dir.y, -0.05);

        // Physical 3-stop Rayleigh/Mie sky gradient (warm golden pass without grey cancellation)
        vec3 zenithBlue = vec3(0.068, 0.195, 0.48);
        vec3 midCerulean = vec3(0.21, 0.43, 0.70);
        vec3 horizonCool = vec3(0.42, 0.58, 0.76);
        vec3 horizonChampagne = vec3(0.80, 0.71, 0.54);
        vec3 horizonGold = vec3(0.94, 0.73, 0.42);

        float hCurve = exp(-max(y, 0.0) * 3.85);
        float midCurve = exp(-max(y, 0.0) * 1.40);
        vec3 skyCol = mix(zenithBlue, midCerulean, midCurve * 0.84);
        vec3 horizTint = mix(horizonCool, horizonChampagne, smoothstep(0.10, 0.68, sunPos));
        horizTint = mix(horizTint, horizonGold, spow(sunPos, 2.1) * 0.88 + 0.08 * uSurge);
        skyCol = mix(skyCol, horizTint, hCurve);

        // Henyey-Greenstein Mie golden morning pass aureole
        float g = 0.74;
        float mie = (1.0 - g * g) / (4.0 * 3.14159 * spow(1.0 + g * g - 2.0 * g * clamp(mu, -0.99, 0.995), 1.5));
        skyCol += vec3(0.95, 0.71, 0.36) * min(mie * 0.125, 0.32) * exp(-max(y, 0.0) * 1.9);

        // High-altitude sunlit morning cirrus wisps
        if (dir.y > 0.03) {
          vec2 skyUv = dir.xz / (dir.y + 0.16);
          vec2 windDrift = vec2(uTime * 0.012, uTime * 0.008);
          float c1 = fbm4(vec3(skyUv * vec2(0.55, 1.35) - windDrift, 1.4));
          float c2 = fbm4(vec3(skyUv * vec2(1.4, 2.8) - windDrift * 1.6, 4.1));
          float cirrus = smoothstep(0.14, 0.68, c1 * 0.72 + c2 * 0.35) * smoothstep(0.03, 0.24, dir.y) * smoothstep(0.92, 0.35, dir.y);
          vec3 cirrusShade = vec3(0.62, 0.70, 0.82);
          vec3 cirrusSun = vec3(0.96, 0.84, 0.68);
          vec3 cirrusCol = mix(cirrusShade, cirrusSun, 0.45 + 0.55 * spow(sunPos, 1.6));
          skyCol = mix(skyCol, cirrusCol, cirrus * 0.48);
        }

        // Crisp limb-darkened solar disc (only element allowed > 1.05 for clean optical bloom)
        float sunDisc = smoothstep(0.99915, 0.99968, mu);
        float sunCorona = spow(sunPos, 180.0) * 0.32;
        skyCol += vec3(0.95, 0.78, 0.46) * sunCorona;
        skyCol = mix(skyCol, vec3(1.58, 1.36, 0.98), sunDisc * smoothstep(-0.02, 0.06, dir.y));

        // Gentle ground haze below horizon
        if (dir.y < 0.0) {
          skyCol = mix(skyCol, vec3(0.36, 0.46, 0.56), smoothstep(0.0, -0.18, dir.y));
        }

        gl_FragColor = vec4(skyCol, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),o=new ut(new ya(480,48,32),r);o.frustumCulled=!1,n.add(o);const s=new Ke({uniforms:t,vertexShader:`
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      vec3 safeNormV(vec3 v) {
        float l2 = dot(v, v);
        return l2 > 1e-10 ? v * inversesqrt(l2) : vec3(0.0, 1.0, 0.0);
      }
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = safeNormV(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uTime;
      uniform float uSurge;
      uniform vec3 uSunDir;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vUv;

      void main() {
        vec3 N = safeNorm(vWorldNormal);
        float detailRock = fbm4(vWorldPos * 0.085);
        float ridgeDetail = ridgedFbm(vWorldPos * 0.14);

        // Perturb normal slightly for craggy alpine couloirs
        N = safeNorm(N + vec3(detailRock * 0.22, (ridgeDetail - 0.5) * 0.15, detailRock * 0.18));

        float sunDiff = max(dot(N, uSunDir), 0.0);
        float skyFill = 0.35 + 0.65 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0);

        // Stratified alpine granite, sub-alpine conifer forest & high snow gullies
        vec3 pineForest = vec3(0.065, 0.135, 0.085);
        vec3 graniteCliff = vec3(0.24, 0.23, 0.22);
        vec3 warmScree = vec3(0.32, 0.27, 0.21);
        vec3 alpineSnow = vec3(0.76, 0.81, 0.88);

        float elev = vWorldPos.y;
        float forestMask = smoothstep(14.5, 5.5, elev + detailRock * 3.2) * smoothstep(0.45, 0.78, N.y);
        float snowMask = smoothstep(15.5, 24.5, elev + detailRock * 3.0) * smoothstep(0.42, 0.76, N.y - uSunDir.x * 0.08);

        vec3 rockCol = mix(graniteCliff, warmScree, clamp(ridgeDetail * 0.85, 0.0, 1.0));
        vec3 albedo = mix(rockCol, pineForest, forestMask);
        albedo = mix(albedo, alpineSnow, snowMask * 0.85);

        vec3 sunLight = vec3(0.96, 0.78, 0.52) * sunDiff * 1.12;
        vec3 ambient = vec3(0.24, 0.36, 0.54) * skyFill * 0.58;
        vec3 col = albedo * (ambient + sunLight);

        // 3-stop warm golden-hour aerial perspective across distant alpine ridges
        float dist = length(vWorldPos - cameraPosition);
        vec3 viewDir = safeNorm(vWorldPos - cameraPosition);
        float sunAlign = max(dot(viewDir, uSunDir), 0.0);
        float hazeAmt = clamp(1.0 - exp(-dist * 0.0070), 0.0, 0.78);
        vec3 ridgeHaze = mix(vec3(0.28, 0.46, 0.68), vec3(0.76, 0.67, 0.52), smoothstep(0.12, 0.68, sunAlign));
        ridgeHaze = mix(ridgeHaze, vec3(0.93, 0.72, 0.42), spow(sunAlign, 2.3) * 0.84 + 0.08 * uSurge);
        col = mix(col, ridgeHaze, hazeAmt);

        gl_FragColor = vec4(min(col, vec3(0.95)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),l=Ac(52,82,21.5,160,22,3109),c=Ac(92,148,36,160,20,7741),f=new ut(Ho([l,c]),s);n.add(f);const d=156,h=192,p=new en(d,d,h,h);p.rotateX(-Math.PI/2);const g=p.attributes.position,x=new Float32Array(g.count*2);for(let ie=0;ie<g.count;ie++){const He=g.getX(ie),ze=g.getZ(ie),Oe=ln(He,ze);g.setY(ie,Oe);const et=Math.abs(He-fn(ze)),Mt=1-qa(.95,2.15,et);x[ie*2+0]=et,x[ie*2+1]=Mt}p.setAttribute("aStreamMeta",new De(x,2)),p.computeVertexNormals();const m=new Ke({uniforms:t,vertexShader:`
      attribute vec2 aStreamMeta;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vStreamMeta;

      void main() {
        vStreamMeta = aStreamMeta;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-6, 0.0));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uTime;
      uniform float uSurge;
      uniform vec3 uSunDir;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vStreamMeta;

      void main() {
        vec3 N = safeNorm(vWorldNormal);
        vec3 V = safeNorm(cameraPosition - vWorldPos);

        float nMacro = fbm4(vWorldPos * 0.14);
        float nDetail = fbm4(vWorldPos * 1.15);
        float nMicro = snoise(vWorldPos * 4.8);

        // Perturb surface normal subtly for soil, turf & scree micro-relief
        N = safeNorm(N + vec3(nDetail * 0.14 + nMicro * 0.05, 0.0, nDetail * 0.14 - nMicro * 0.05));

        // 1) Meadow turf palette (matches 3D grass root tones seamlessly!)
        vec3 lushClover = vec3(0.085, 0.21, 0.058);
        vec3 warmFescue = vec3(0.19, 0.27, 0.075);
        vec3 richLoam = vec3(0.11, 0.082, 0.052);
        vec3 turfCol = mix(lushClover, warmFescue, clamp(nMacro * 0.8 + 0.5, 0.0, 1.0));
        turfCol = mix(turfCol, richLoam, smoothstep(0.32, 0.72, nDetail) * 0.28);

        // 2) Steep granite scree & weathered gorge rock (smooth 3D FBM, zero contour banding!)
        float rockMask = smoothstep(0.88, 0.58, N.y - nMacro * 0.07);
        float cliffVar = clamp(fbm4(vWorldPos * 0.16 + vec3(2.3, 0.0, 1.1)) * 0.75 + 0.5, 0.0, 1.0);
        float screeVar = clamp(snoise(vWorldPos * 0.58) * 0.5 + 0.5, 0.0, 1.0);
        vec3 graniteCol = mix(vec3(0.20, 0.19, 0.175), vec3(0.33, 0.28, 0.215), cliffVar * 0.72 + screeVar * 0.28);
        vec3 groundCol = mix(turfCol, graniteCol, rockMask);

        // 3) Dark wet soil bank & dark wet river cobbles along both stream edges
        float distS = vStreamMeta.x;
        float wetness = vStreamMeta.y;
        if (distS < 2.8) {
          float shA = snoise(vec3(vWorldPos.xz * 6.2, 1.3)) * 0.5 + 0.5;
          float shB = snoise(vec3(vWorldPos.xz * 12.8 + 3.7, 2.9)) * 0.5 + 0.5;
          float cobbleMask = smoothstep(0.24, 0.76, shA * 0.65 + shB * 0.35);
          float crevice = 0.48 + 0.52 * smoothstep(0.16, 0.58, shA);

          vec3 wetSlate = vec3(0.055, 0.064, 0.068);
          vec3 wetUmberCobble = vec3(0.145, 0.112, 0.078);
          vec3 darkLoamSoil = vec3(0.042, 0.034, 0.025);
          vec3 cobbles = mix(wetSlate, wetUmberCobble, cobbleMask) * crevice;
          cobbles = mix(darkLoamSoil, cobbles, 0.72 + 0.28 * shB);

          // Strong physical moisture darkening along wet bank & riverbed
          cobbles *= mix(0.88, 0.38, wetness);

          float bankMoss = smoothstep(2.65, 1.45, distS) * smoothstep(0.95, 1.55, distS);
          float wetSoilBand = smoothstep(2.10, 1.25, distS);
          groundCol = mix(groundCol, vec3(0.052, 0.175, 0.045), bankMoss * 0.75);
          groundCol = mix(groundCol, darkLoamSoil, wetSoilBand * 0.68);
          groundCol = mix(groundCol, cobbles, smoothstep(1.82, 1.02, distS));
        }

        // Drifting cloud & canopy dappled shadows + travelling wind-wave sheen
        vec2 cloudDrift = vWorldPos.xz * 0.045 - vec2(0.79, 0.613) * uTime * 0.11;
        float cloudShadow = 0.68 + 0.32 * smoothstep(-0.25, 0.35, fbm4(vec3(cloudDrift, 2.0)));

        float sunDiff = max(dot(N, uSunDir), 0.0) * cloudShadow;
        float skyAmb = 0.36 + 0.64 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0);

        vec3 lit = groundCol * (
          vec3(0.25, 0.36, 0.50) * skyAmb * 0.62 +
          vec3(0.98, 0.80, 0.54) * sunDiff * 1.18
        );

        // Wet shoreline specular glint
        if (wetness > 0.05) {
          vec3 H = safeNorm(uSunDir + V);
          float wetSpec = spow(max(dot(N, H), 0.0), 48.0) * wetness * 0.42;
          lit += vec3(0.95, 0.84, 0.65) * wetSpec;
        }

        lit = applyMorningAerialHaze(lit, vWorldPos, cameraPosition, uSunDir, uSurge);
        gl_FragColor = vec4(min(lit, vec3(0.96)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),u=new ut(p,m);n.add(u);const M=150,S=14,v=-46,T=28,w=1.68,E=[],C=[];for(let ie=0;ie<M;ie++){const He=ie/M,ze=(ie+1)/M,Oe=v+(T-v)*He,et=v+(T-v)*ze,Mt=fn(Oe),pt=fn(et),Pt=zs(Oe)-.19,Ut=zs(et)-.19;for(let zt=0;zt<S;zt++){const A=zt/S,U=(zt+1)/S,Y=Mt+(A*2-1)*w,Z=Mt+(U*2-1)*w,W=pt+(A*2-1)*w,xe=pt+(U*2-1)*w;E.push(Y,Pt,Oe,W,Ut,et,Z,Pt,Oe),C.push(A,He*18,A,ze*18,U,He*18),E.push(Z,Pt,Oe,W,Ut,et,xe,Ut,et),C.push(U,He*18,A,ze*18,U,ze*18)}}const y=new st;y.setAttribute("position",new ct(E,3)),y.setAttribute("uv",new ct(C,2)),y.computeVertexNormals();const _=new Ke({uniforms:t,transparent:!0,depthWrite:!1,vertexShader:`
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uTime;
      uniform float uStreamFlow;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        float edgeDist = abs(vUv.x - 0.5) * 2.0;
        float bankAlpha = 1.0 - smoothstep(0.76, 0.98, edgeDist);
        if (bankAlpha < 0.01) discard;

        vec2 flowUv1 = vec2(vUv.x * 4.4, vUv.y * 1.55 - uStreamFlow);
        vec2 flowUv2 = vec2(vUv.x * 8.4 + 1.3, vUv.y * 2.75 - uStreamFlow * 1.42);

        // Crisp multi-scale flowing liquid wave & capillary normals
        float r1 = snoise(vec3(flowUv1 * 2.3, uTime * 0.70));
        float r2 = snoise(vec3(flowUv2 * 3.9, -uTime * 0.92));
        float r3 = snoise(vec3(vWorldPos.xz * 7.8 - vec2(0.0, uStreamFlow * 2.4), uTime * 1.35));
        vec3 N = safeNorm(vec3((r1 * 0.65 + r2 * 0.45 + r3 * 0.30) * 0.26, 1.0, (r2 * 0.65 - r1 * 0.42 + r3 * 0.30) * 0.28));
        vec3 Nsparkle = safeNorm(vec3((r2 * 0.55 + r3 * 0.85) * 0.44, 1.0, (r1 * 0.45 - r3 * 0.85) * 0.44));

        vec3 V = safeNorm(cameraPosition - vWorldPos);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        // Physical Schlick Fresnel capped so deep translucent emerald water & dark pebbles stay visible
        float fresnel = clamp(0.035 + 0.55 * spow(1.0 - ndv, 3.8), 0.035, 0.56);

        // Dark wet submerged riverbed pebbles + crisp golden water caustics
        vec2 refractXZ = vWorldPos.xz + N.xz * 0.22;
        float pebA = snoise(vec3(refractXZ * 5.8, 1.1)) * 0.5 + 0.5;
        float pebB = snoise(vec3(refractXZ * 12.2 + 4.2, 2.7)) * 0.5 + 0.5;
        float stoneDome = smoothstep(0.28, 0.74, pebA * 0.68 + pebB * 0.32);
        float darkCrevice = 0.40 + 0.60 * smoothstep(0.18, 0.56, pebA);

        vec3 wetBasalt = vec3(0.022, 0.032, 0.038);
        vec3 wetSlate = vec3(0.045, 0.068, 0.072);
        vec3 wetAmberCobble = vec3(0.135, 0.092, 0.048);
        vec3 bedAlbedo = mix(wetBasalt, mix(wetSlate, wetAmberCobble, pebB), stoneDome) * darkCrevice;

        // Animated morning sunlight caustic filaments dancing over dark wet cobbles
        float cNet1 = 1.0 - abs(snoise(vec3(refractXZ * 4.8 - vec2(0.0, uStreamFlow * 0.58), uTime * 0.78)));
        float cNet2 = 1.0 - abs(snoise(vec3(refractXZ * 8.2 + vec2(1.7, -uStreamFlow * 0.85), -uTime * 0.95)));
        float caustics = spow(cNet1 * cNet2, 4.2) * 1.65;

        float bedSun = max(uSunDir.y, 0.24);
        vec3 refractedBed = bedAlbedo * (vec3(0.18, 0.30, 0.42) * 0.55 + vec3(0.98, 0.82, 0.52) * (bedSun * 1.15 + caustics * 0.95));

        // Deep Beer-Lambert glacial teal-emerald central channel + wet dark bank margins
        float centerProfile = clamp(1.0 - edgeDist * edgeDist, 0.0, 1.0);
        float waterDepth = centerProfile * 1.48;
        vec3 transmittance = exp(-waterDepth * vec3(2.15, 0.50, 0.42));
        vec3 deepTealVol = vec3(0.015, 0.138, 0.152) * (0.72 + 0.28 * bedSun);
        vec3 underWaterCol = refractedBed * transmittance + deepTealVol * (1.0 - transmittance.r) * 0.88;

        // Wet bank shadow & dark soil/stone rim along both stream edges
        float bankDarken = 1.0 - 0.52 * smoothstep(0.50, 0.92, edgeDist);
        underWaterCol *= bankDarken;

        // True cerulean sky & lush dark canopy/bank Fresnel reflection (never pale grey!)
        vec3 R = reflect(-V, N);
        float reflSun = max(dot(R, uSunDir), 0.0);
        vec3 ceruleanSkyRefl = vec3(0.085, 0.265, 0.485);
        vec3 warmSunSkyRefl = vec3(0.64, 0.54, 0.36);
        vec3 canopyBankRefl = vec3(0.038, 0.118, 0.072);
        vec3 skyRefl = mix(ceruleanSkyRefl, warmSunSkyRefl, spow(reflSun, 7.5) * 0.38);
        skyRefl = mix(skyRefl, canopyBankRefl, smoothstep(0.36, 0.84, edgeDist) * 0.65);

        // Localized white riffle foam ONLY over discrete shallow rapids zones
        float rapidsZone = smoothstep(0.24, 0.76, sin(vWorldPos.z * 0.46 + 0.8) * cos(vWorldPos.z * 0.21 - 0.35) + 0.18 * uSurge);
        float wakeNoise = fbm4(vec3(flowUv1 * 2.2, uTime * 0.60));
        float laceErode = snoise(vec3(flowUv2 * 4.8, uTime * 0.95)) * 0.5 + 0.5;
        float foam = rapidsZone * smoothstep(0.52, 0.84, wakeNoise + 0.14 * uSurge) * smoothstep(0.42, 0.80, laceErode);

        // Concentrated sunlit diamond water sparkles (zero broad whitish wash!)
        vec3 H = safeNorm(uSunDir + V);
        float sunSparkle = spow(max(dot(Nsparkle, H), 0.0), 280.0) * 2.35 + spow(max(dot(Nsparkle, H), 0.0), 92.0) * 0.22;

        vec3 col = mix(underWaterCol, skyRefl, fresnel);
        col = mix(col, vec3(0.86, 0.92, 0.94), foam * 0.62);
        col += vec3(1.26, 1.04, 0.74) * sunSparkle;

        col = applyMorningAerialHaze(col, vWorldPos, cameraPosition, uSunDir, uSurge);
        float finalAlpha = bankAlpha * clamp(0.90 + fresnel * 0.08 + foam * 0.10, 0.0, 0.98);
        gl_FragColor = vec4(col, finalAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),P=new ut(y,_);P.renderOrder=2,n.add(P);const I=[{x:-5.2,z:-1.4,rx:1.85,ry:1.45,rz:1.55,rotY:.4,seed:101},{x:-6.8,z:-2.8,rx:2.35,ry:2.15,rz:1.9,rotY:1.1,seed:102},{x:-4.1,z:-.3,rx:.95,ry:.68,rz:.85,rotY:2.2,seed:103},{x:-8.6,z:-6.4,rx:2.75,ry:2.55,rz:2.15,rotY:.7,seed:104},{x:-3.2,z:3.6,rx:.78,ry:.52,rz:.68,rotY:1.6,seed:105},{x:4.5,z:.8,rx:1.45,ry:1.05,rz:1.25,rotY:-.5,seed:106},{x:6.2,z:-.6,rx:1.95,ry:1.58,rz:1.62,rotY:.9,seed:107},{x:3.6,z:1.9,rx:.72,ry:.48,rz:.65,rotY:2.5,seed:108},{x:8.8,z:-5.4,rx:2.45,ry:1.95,rz:2.05,rotY:-1.2,seed:109},{x:fn(4.8)-1.38,z:4.8,rx:.68,ry:.42,rz:.58,rotY:.3,seed:110},{x:fn(2.1)+1.32,z:2.1,rx:.82,ry:.5,rz:.74,rotY:1.9,seed:111},{x:fn(-2.6)-1.42,z:-2.6,rx:.92,ry:.58,rz:.8,rotY:.8,seed:112},{x:fn(-6.5)+1.48,z:-6.5,rx:1.12,ry:.74,rz:.92,rotY:-.7,seed:113},{x:fn(-11.2)-1.55,z:-11.2,rx:1.28,ry:.86,rz:1.08,rotY:1.4,seed:114},{x:-11.5,z:-14.5,rx:3.2,ry:2.8,rz:2.6,rotY:.5,seed:115},{x:11.2,z:-13.2,rx:2.9,ry:2.4,rz:2.5,rotY:-.9,seed:116}],F=[],X=[],q=new yt;for(const ie of I){const He=ln(ie.x,ie.z),ze=ie.z>-9?4:3,Oe=Pv(ie.rx,ie.ry,ie.rz,ie.seed,ze);q.makeRotationY(ie.rotY),Oe.applyMatrix4(q),Oe.translate(ie.x,He+ie.ry*.32,ie.z),X.push(Oe),F.push({x:ie.x,z:ie.z,r:Math.max(ie.rx,ie.rz)*.82})}const B=new Ke({uniforms:t,vertexShader:`
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-6, 0.0));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uSurge;
      uniform vec3 uSunDir;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      // 3D angular granite crag fractures + fine tactile bryophyte moss-tuft micro-relief (zero rings!)
      float sampleBoulderRelief(vec3 p, float mossAmt) {
        float r1 = 1.0 - abs(snoise(p * 1.18 + vec3(0.4, 1.3, 0.9)));
        float r2 = 1.0 - abs(snoise(p * 2.65 + vec3(2.8, 0.7, 1.9)));
        float r3 = 1.0 - abs(snoise(p * 6.2 + vec3(1.1, 3.4, 2.2)));
        float rockCrag = (r1 * r1 * 0.56 + r2 * r2 * 0.31 + r3 * 0.13) * 0.54 + snoise(p * 14.5) * 0.048;

        float hummock = 1.0 - abs(snoise(p * 3.7 + vec3(4.2, 1.5, 0.8)));
        float starTuft = (1.0 - abs(snoise(p * 11.8))) * 0.145 + snoise(p * 23.5) * 0.068;
        float mossRelief = hummock * hummock * 0.24 + starTuft;

        return mix(rockCrag, mossRelief + rockCrag * 0.22, mossAmt * 0.82);
      }

      void main() {
        vec3 N0 = safeNorm(vWorldNormal);
        vec3 V = safeNorm(cameraPosition - vWorldPos);

        // Ragged cushion-moss colonies clinging to shelves & crevices while sharp granite crags poke through!
        float cragPeak = 1.0 - abs(snoise(vWorldPos * 1.18 + vec3(0.4, 1.3, 0.9)));
        float colonyMacro = fbm4(vWorldPos * 0.66 + vec3(1.7, 0.4, 2.3));
        float colonyRagged = snoise(vWorldPos * 2.4 + 3.1) * 0.22 + snoise(vWorldPos * 6.4) * 0.10;
        float mossScore = N0.y * 0.78 + colonyMacro * 0.40 + colonyRagged - cragPeak * cragPeak * 0.25;
        float mossMask = smoothstep(0.40, 0.50, mossScore);

        // Crisp 3D finite-difference bump normal (rugged chiseled granite + tactile leafy moss tufts)
        float eps = 0.020;
        float hC = sampleBoulderRelief(vWorldPos, mossMask);
        float hX = sampleBoulderRelief(vWorldPos + vec3(eps, 0.0, 0.0), mossMask);
        float hY = sampleBoulderRelief(vWorldPos + vec3(0.0, eps, 0.0), mossMask);
        float hZ = sampleBoulderRelief(vWorldPos + vec3(0.0, 0.0, eps), mossMask);
        vec3 grad = vec3(hX - hC, hY - hC, hZ - hC) / eps;
        vec3 surfGrad = grad - N0 * dot(grad, N0);
        float bumpStrength = mix(0.46, 0.35, mossMask);
        vec3 N = safeNorm(N0 - surfGrad * bumpStrength);

        // Rugged weathered alpine granite with dark fissure crevices & fine quartz/biotite mineral grain
        float rockMacro = fbm4(vWorldPos * 0.62 + vec3(0.8, 2.1, 1.4)) * 0.5 + 0.5;
        float fineMineral = snoise(vWorldPos * 18.5) * 0.5 + 0.5;
        vec3 fissureDark = vec3(0.088, 0.082, 0.078);
        vec3 weatheredGreyBrown = vec3(0.335, 0.298, 0.258);
        vec3 coolQuartzFacet = vec3(0.285, 0.295, 0.308);
        float creviceAO = clamp(0.46 + hC * 0.88, 0.34, 1.10);

        vec3 rockCol = mix(fissureDark, weatheredGreyBrown, smoothstep(0.16, 0.78, rockMacro));
        rockCol = mix(rockCol, coolQuartzFacet, smoothstep(0.35, 0.75, cragPeak) * 0.45);
        rockCol *= (0.86 + 0.28 * fineMineral) * creviceAO;

        // Crisp crustose sage-ochre lichen rosettes on bare granite faces
        float lichNoise = fbm4(vWorldPos * 2.25 + vec3(3.1, 0.0, 1.7));
        float lichen = smoothstep(0.32, 0.48, lichNoise) * smoothstep(0.05, 0.55, N0.y) * (1.0 - mossMask);
        rockCol = mix(rockCol, vec3(0.35, 0.38, 0.24), lichen * 0.58);

        // Dark earthy humus/rhizoid shadow rim right where raised moss cushions meet bare granite
        float colonyRim = smoothstep(0.01, 0.22, mossMask) * (1.0 - smoothstep(0.22, 0.62, mossMask));
        rockCol *= (1.0 - colonyRim * 0.42);

        // Tactile multi-scale bryophyte moss tufts (deep inter-tuft pockets -> sunlit chartreuse shoot tips)
        float hummockSwell = 1.0 - abs(snoise(vWorldPos * 3.7 + vec3(4.2, 1.5, 0.8)));
        float tuftMicro = clamp((1.0 - abs(snoise(vWorldPos * 11.8))) * 0.68 + (snoise(vWorldPos * 23.5) * 0.5 + 0.5) * 0.32, 0.0, 1.0);
        vec3 deepTuftPocket = vec3(0.026, 0.105, 0.022);
        vec3 lushBryophyte = vec3(0.088, 0.248, 0.044);
        vec3 sunlitShootTip = vec3(0.215, 0.395, 0.078);

        vec3 mossCol = mix(deepTuftPocket, lushBryophyte, smoothstep(0.18, 0.72, tuftMicro * 0.70 + hummockSwell * 0.30));
        mossCol = mix(mossCol, sunlitShootTip, spow(tuftMicro, 1.8) * (0.45 + 0.55 * hummockSwell) * 0.82);
        mossCol *= (0.78 + 0.26 * smoothstep(0.08, 0.65, mossMask));

        vec3 surfaceCol = mix(rockCol, mossCol, mossMask);

        float sunDiff = max(dot(N, uSunDir), 0.0);
        float mossWrap = clamp(dot(N, uSunDir) * 0.40 + 0.60, 0.0, 1.0) * mossMask * 0.18;
        float skyAmb = 0.34 + 0.66 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        float bounce = clamp(-N.y * 0.5 + 0.5, 0.0, 1.0) * 0.22;

        vec3 lit = surfaceCol * (
          vec3(0.23, 0.34, 0.50) * skyAmb * 0.64 +
          vec3(0.98, 0.80, 0.54) * (sunDiff * 1.20 + mossWrap) +
          vec3(0.15, 0.24, 0.09) * bounce
        );

        // Backlit bryophyte velvet fuzz + crisp quartz mineral glint on angular granite facets
        float rim = spow(1.0 - max(dot(N, V), 0.0), 2.8);
        lit += vec3(0.26, 0.44, 0.10) * rim * mossMask * (0.30 + 0.70 * max(dot(-V, uSunDir), 0.0)) * 0.38;

        vec3 H = safeNorm(uSunDir + V);
        float micaSpec = spow(max(dot(N, H), 0.0), 76.0) * (1.0 - mossMask) * (0.22 + 0.26 * fineMineral);
        lit += vec3(0.96, 0.87, 0.70) * micaSpec;

        lit = applyMorningAerialHaze(lit, vWorldPos, cameraPosition, uSunDir, uSurge);
        gl_FragColor = vec4(min(lit, vec3(0.96)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),K=new ut(Ho(X),B);n.add(K);const H=[{x:-5.8,z:-4.2,scale:1.12,seed:401},{x:5.5,z:-2.6,scale:1.18,seed:402},{x:-9.4,z:-9.6,scale:1.32,seed:403},{x:8.6,z:-8.4,scale:1.25,seed:404},{x:3.2,z:-13.2,scale:1.02,seed:405},{x:-4.4,z:-16.8,scale:1.18,seed:406}],se=[],ue=[];for(const ie of H){const He=ln(ie.x,ie.z),{branchGeos:ze,leafAnchors:Oe}=Lv(new D(ie.x,He,ie.z),ie.scale,ie.seed);se.push(...ze),ue.push(...Oe),F.push({x:ie.x,z:ie.z,r:.48*ie.scale})}const de=new Ke({uniforms:t,vertexShader:`
      ${je}
      ${kt}
      attribute float aSway;
      uniform float uTime;
      uniform float uWindPhase;
      uniform float uIntensity;
      uniform float uSurge;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec2 wind = computeValleyWind(wp.xz, uTime, uWindPhase, uIntensity, uSurge);
        float flex = spow(aSway, 1.85) * 0.16;
        wp.xz += wind * flex;
        wp.y -= length(wind) * flex * 0.12;

        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-6, 0.0));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uSurge;
      uniform vec3 uSunDir;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec2 vUv;

      void main() {
        vec3 N = safeNorm(vWorldNormal);
        float furrow = ridgedFbm(vec3(vUv.x * 10.0, vWorldPos.y * 1.6, vUv.y * 2.0));
        vec3 darkBark = vec3(0.11, 0.082, 0.058);
        vec3 sunBark = vec3(0.27, 0.20, 0.14);
        vec3 barkCol = mix(darkBark, sunBark, clamp(furrow * 0.85, 0.0, 1.0));

        // Subtle emerald bark moss on upward/shaded boughs
        float moss = smoothstep(0.35, 0.78, N.y + furrow * 0.25) * 0.58;
        barkCol = mix(barkCol, vec3(0.08, 0.22, 0.065), moss);

        float sunDiff = max(dot(N, uSunDir), 0.0);
        float skyAmb = 0.35 + 0.65 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 lit = barkCol * (
          vec3(0.24, 0.34, 0.48) * skyAmb * 0.65 +
          vec3(0.98, 0.80, 0.54) * sunDiff * 1.12
        );

        lit = applyMorningAerialHaze(lit, vWorldPos, cameraPosition, uSunDir, uSurge);
        gl_FragColor = vec4(min(lit, vec3(0.95)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),_e=new ut(Ho(se),de);n.add(_e);const Re=Nv(),j=ue.length,le=new Float32Array(j*4),Te=new Float32Array(j),fe=new Ke({uniforms:t,side:Bt,vertexShader:`
      ${je}
      ${kt}
      attribute vec4 aCrownData;
      attribute float aLeafSeed;
      uniform float uTime;
      uniform float uWindPhase;
      uniform float uIntensity;
      uniform float uSurge;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vCrownNormal;
      varying float vSeed;

      void main() {
        vUv = uv;
        vSeed = aLeafSeed;

        vec4 instWorld = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vec2 wind = computeValleyWind(instWorld.xz, uTime, uWindPhase, uIntensity, uSurge);

        // Synchronized branch sway + lively high-frequency leaf flutter
        float branchFlex = spow(aCrownData.w, 1.85) * 0.16;
        float flutter = sin(uTime * (4.2 + 2.2 * uIntensity + 4.0 * uSurge) + aLeafSeed * 25.0 + position.x * 6.0)
                      * (0.024 + 0.025 * length(wind));

        instWorld.xz += wind * (branchFlex + 0.055);
        instWorld.y += flutter - length(wind) * branchFlex * 0.10;

        vWorldPos = instWorld.xyz;
        // Spherical volumetric crown normal for lush self-shadowed cloud-like canopy lighting!
        vCrownNormal = safeNorm(instWorld.xyz - aCrownData.xyz + normal * 0.42);

        gl_Position = projectionMatrix * viewMatrix * instWorld;
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uSurge;
      uniform vec3 uSunDir;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vCrownNormal;
      varying float vSeed;

      float sampleBoughClump(vec3 p) {
        return snoise(p * 1.95) * 0.66 + snoise(p * 4.15 + 2.3) * 0.34;
      }

      void main() {
        // Multi-scale serrated oak-bough silhouette + internal lacy sky-holes!
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float angle = atan(p.y, p.x);
        float lobes = 0.22 * sin(angle * 7.0 + vSeed * 12.0) + 0.14 * cos(angle * 13.0 - vSeed * 7.0);
        float clumpMask = fbm4(vec3(vUv * 5.2, vSeed * 13.7));
        float fineLeaf = snoise(vec3(vUv * 15.5, vSeed * 29.1));

        // Outer serrated bough contour + internal sun-dappled sky perforations
        if (r > 0.74 + lobes + clumpMask * 0.26) discard;
        if (r > 0.24 && (clumpMask * 0.55 + fineLeaf * 0.45) < -0.16) discard;

        // Strong 3D sub-clump normal & self-occlusion contrast so crowns read as crisp layered oak boughs!
        float e = 0.08;
        float c0 = sampleBoughClump(vWorldPos);
        float cx = sampleBoughClump(vWorldPos + vec3(e, 0.0, 0.0));
        float cy = sampleBoughClump(vWorldPos + vec3(0.0, e, 0.0));
        float cz = sampleBoughClump(vWorldPos + vec3(0.0, 0.0, e));
        vec3 subBoughGrad = vec3(cx - c0, cy - c0, cz - c0) / e;

        vec3 N = safeNorm(vCrownNormal - subBoughGrad * 0.62 + vec3(p.x * 0.34 + fineLeaf * 0.22, 0.22, p.y * 0.34 - fineLeaf * 0.22));
        vec3 V = safeNorm(cameraPosition - vWorldPos);

        float leafVar = fineLeaf * 0.5 + 0.5;
        float innerAO = clamp(0.52 + 0.48 * smoothstep(-0.35, 0.45, c0 + vCrownNormal.y * 0.35), 0.38, 1.08);

        vec3 deepForest = vec3(0.032, 0.115, 0.030);
        vec3 sunlitEmerald = vec3(0.17, 0.36, 0.072);
        vec3 goldenOlive = vec3(0.30, 0.39, 0.088);

        vec3 baseLeaf = mix(deepForest, sunlitEmerald, clamp(leafVar * 0.72 + c0 * 0.35 + 0.18, 0.0, 1.0));
        baseLeaf = mix(baseLeaf, goldenOlive, smoothstep(0.50, 0.95, vSeed) * 0.54);

        float sunDiff = max(dot(N, uSunDir), 0.0);
        float wrapDiff = clamp(dot(N, uSunDir) * 0.5 + 0.5, 0.0, 1.0);
        float skyAmb = 0.30 + 0.70 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0);

        // Warm golden morning chlorophyll subsurface translucency when backlit!
        float backSun = spow(max(dot(-V, uSunDir), 0.0), 2.6) * (0.30 + 0.70 * wrapDiff);
        vec3 sss = vec3(0.44, 0.58, 0.11) * backSun * 0.65;

        vec3 lit = baseLeaf * innerAO * (
          vec3(0.19, 0.31, 0.46) * skyAmb * 0.60 +
          vec3(0.98, 0.80, 0.52) * (sunDiff * 1.24 + wrapDiff * 0.16)
        ) + sss;

        lit = applyMorningAerialHaze(lit, vWorldPos, cameraPosition, uSunDir, uSurge);
        gl_FragColor = vec4(min(lit, vec3(0.95)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),we=new Ua(Re,fe,j),ve=new Nt,qe=la(8821);for(let ie=0;ie<j;ie++){const He=ue[ie];ve.position.copy(He.pos),ve.rotation.set((qe()-.5)*.7,qe()*Math.PI*2,(qe()-.5)*.7),ve.scale.setScalar(He.size),ve.updateMatrix(),we.setMatrixAt(ie,ve.matrix),le[ie*4+0]=He.crownCenter.x,le[ie*4+1]=He.crownCenter.y,le[ie*4+2]=He.crownCenter.z,le[ie*4+3]=He.sway,Te[ie]=He.seed}we.instanceMatrix.needsUpdate=!0,Re.setAttribute("aCrownData",new Bn(le,4)),Re.setAttribute("aLeafSeed",new Bn(Te,1)),n.add(we);const Je=9800,$e=Rv(5),Qe=new Float32Array(Je*4),z=new Ke({uniforms:t,side:Bt,vertexShader:`
      ${je}
      ${kt}
      attribute vec4 aGrassTrait;
      uniform float uTime;
      uniform float uWindPhase;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec4 uPointer;

      varying float vH;
      varying float vWindSheen;
      varying float vGoldTip;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vInstTint;

      void main() {
        vH = uv.y;
        vGoldTip = aGrassTrait.w;
        #ifdef USE_INSTANCING_COLOR
          vInstTint = instanceColor;
        #else
          vInstTint = vec3(0.22, 0.42, 0.11);
        #endif

        vec3 bladeOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        vec3 localScaled = mat3(instanceMatrix) * position;

        // Travelling 2D valley Perlin/Simplex wind waves + micro blade flutter
        vec2 wind = computeValleyWind(bladeOrigin.xz, uTime, uWindPhase, uIntensity, uSurge);
        float flutter = sin(uTime * (3.6 + 2.0 * uIntensity) + aGrassTrait.y * 6.2831) * 0.065;
        vec2 totalBend = wind * aGrassTrait.z + vec2(flutter, -flutter * 0.6);

        // Interactive 3D pointer parting ripple around interaction.pointerWorld!
        if (uPointer.w > 0.005) {
          vec2 fromPtr = bladeOrigin.xz - uPointer.xz;
          float dPtr = length(fromPtr);
          float partMask = (1.0 - smoothstep(0.15, 2.55, dPtr)) * uPointer.w;
          totalBend += safeNorm2(fromPtr) * (partMask * 1.35);
        }

        float hCurve = spow(vH, 1.68);
        vec2 dispXZ = totalBend * hCurve * aGrassTrait.x * 0.72;
        // Arc-length preservation: bent grass tips dip downward naturally instead of stretching!
        float bendLen = length(dispXZ);
        float dipY = -min(aGrassTrait.x * 0.52, (bendLen * bendLen) / max(aGrassTrait.x * 1.45, 0.25));

        vec3 wp = bladeOrigin + localScaled + vec3(dispXZ.x, dipY, dispXZ.y);
        vWorldPos = wp;

        vec3 rawN = mat3(instanceMatrix) * normal;
        vWorldNormal = safeNorm(rawN + vec3(-totalBend.x * vH * 0.85, 0.38, -totalBend.y * vH * 0.85));
        vWindSheen = clamp(length(wind) * 0.55, 0.0, 1.0);

        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uSurge;
      uniform vec3 uSunDir;

      varying float vH;
      varying float vWindSheen;
      varying float vGoldTip;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vInstTint;

      void main() {
        vec3 N = safeNorm(gl_FrontFacing ? vWorldNormal : -vWorldNormal);
        vec3 V = safeNorm(cameraPosition - vWorldPos);

        // Rich root-to-tip botanical color + ambient occlusion at soil base
        vec3 deepRoot = vec3(0.038, 0.105, 0.028);
        vec3 tipSunGold = mix(vInstTint * 1.45, vec3(0.46, 0.44, 0.13), vGoldTip * 0.72);
        vec3 bladeAlbedo = mix(deepRoot, vInstTint, smoothstep(0.0, 0.48, vH));
        bladeAlbedo = mix(bladeAlbedo, tipSunGold, smoothstep(0.45, 1.0, vH));

        float ao = mix(0.32, 1.0, spow(vH, 0.62));
        float sunDiff = max(dot(N, uSunDir), 0.0);
        float skyAmb = 0.36 + 0.64 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0);

        // Morning sun subsurface chlorophyll glow through backlit upper blades
        float backLit = spow(max(dot(-V, uSunDir), 0.0), 2.4) * smoothstep(0.15, 0.95, vH);
        vec3 transGlow = vec3(0.42, 0.54, 0.11) * backLit * 0.58;

        // Travelling silver-gold specular wind-wave sheen across bent grass tips
        vec3 H = safeNorm(uSunDir + V);
        float windSpec = spow(max(dot(N, H), 0.0), 26.0) * vH * (0.22 + 0.45 * vWindSheen);

        vec3 lit = bladeAlbedo * ao * (
          vec3(0.24, 0.36, 0.52) * skyAmb * 0.64 +
          vec3(0.98, 0.80, 0.52) * (sunDiff * 1.08 + 0.18)
        ) + transGlow + vec3(0.72, 0.68, 0.42) * windSpec;

        lit = applyMorningAerialHaze(lit, vWorldPos, cameraPosition, uSunDir, uSurge);
        gl_FragColor = vec4(min(lit, vec3(0.95)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),nt=new Ua($e,z,Je);nt.frustumCulled=!1;const be=la(5519),J=new lt,ce=new D;let ge=0,pe=0;for(;ge<Je&&pe<Je*4;){pe++;const ie=Math.pow(be(),.72)*26.5,He=be()*Math.PI*2,ze=Math.cos(He)*ie*1.15,Oe=Math.sin(He)*ie-3.2,et=Math.abs(ze-fn(Oe));if(et<1.18)continue;let Mt=!1;for(let A=0;A<F.length;A++){const U=F[A],Y=ze-U.x,Z=Oe-U.z;if(Y*Y+Z*Z<U.r*U.r*.72){Mt=!0;break}}if(Mt||(Av(ze,Oe,ce),ce.y<.72))continue;const pt=ln(ze,Oe),Pt=Math.sin(ze*.45+Oe*.38)*.5+.5,Ut=(.36+be()*.46+Pt*.22)*(et<2.4?1.18:1);ve.position.set(ze,pt-.02,Oe),ve.rotation.set((be()-.5)*.22,be()*Math.PI*2,(be()-.5)*.22),ve.scale.set(.85+be()*.55,Ut,.85+be()*.55),ve.updateMatrix(),nt.setMatrixAt(ge,ve.matrix);const zt=be();zt<.45?J.setRGB(.11+be()*.05,.28+be()*.08,.055+be()*.03):zt<.78?J.setRGB(.16+be()*.06,.32+be()*.07,.065+be()*.03):J.setRGB(.22+be()*.07,.31+be()*.06,.075+be()*.03),nt.setColorAt(ge,J),Qe[ge*4+0]=Ut,Qe[ge*4+1]=be(),Qe[ge*4+2]=.72+be()*.52,Qe[ge*4+3]=be(),ge++}nt.count=ge,nt.instanceMatrix.needsUpdate=!0,nt.instanceColor&&(nt.instanceColor.needsUpdate=!0),$e.setAttribute("aGrassTrait",new Bn(Qe,4)),n.add(nt);const R=680,b=Dv(),k=new Float32Array(R*2),Q=new Ke({uniforms:t,side:Bt,vertexShader:`
      ${je}
      ${kt}
      attribute vec2 aFlowerPhase;
      uniform float uTime;
      uniform float uWindPhase;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec4 uPointer;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vPetalCol;

      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vPetalCol = instanceColor;
        #else
          vPetalCol = vec3(0.92, 0.76, 0.16);
        #endif

        vec3 baseOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        vec3 localScaled = mat3(instanceMatrix) * position;

        vec2 wind = computeValleyWind(baseOrigin.xz, uTime, uWindPhase, uIntensity, uSurge);
        if (uPointer.w > 0.005) {
          vec2 fromPtr = baseOrigin.xz - uPointer.xz;
          float dPtr = length(fromPtr);
          float partMask = (1.0 - smoothstep(0.15, 2.55, dPtr)) * uPointer.w;
          wind += safeNorm2(fromPtr) * (partMask * 1.35);
        }

        float hNorm = uv.y;
        float sway = spow(hNorm, 1.65) * aFlowerPhase.y;
        vec2 disp = wind * sway * 0.42;
        float dipY = -min(0.18, dot(disp, disp) * 0.85);

        vec3 wp = baseOrigin + localScaled + vec3(disp.x, dipY, disp.y);
        vWorldPos = wp;
        vWorldNormal = safeNorm(mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uSurge;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vPetalCol;

      void main() {
        vec3 N = safeNorm(gl_FrontFacing ? vWorldNormal : -vWorldNormal);
        float isPetal = step(0.5, vUv.x);
        vec3 stemCol = vec3(0.09, 0.24, 0.055);
        vec3 centerGold = vec3(0.88, 0.56, 0.08);
        vec3 blossom = mix(centerGold, vPetalCol, smoothstep(0.89, 0.96, vUv.y));
        vec3 albedo = mix(stemCol, blossom, isPetal);

        float sunDiff = max(dot(N, uSunDir), 0.0);
        vec3 lit = albedo * (vec3(0.30, 0.40, 0.52) * 0.65 + vec3(0.98, 0.82, 0.58) * (sunDiff * 0.95 + 0.25 * isPetal));
        lit = applyMorningAerialHaze(lit, vWorldPos, cameraPosition, uSunDir, uSurge);
        gl_FragColor = vec4(min(lit, vec3(0.95)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),N=new Ua(b,Q,R);N.frustumCulled=!1;let G=0;for(let ie=0;ie<R*3&&G<R;ie++){const He=Math.pow(be(),.75)*20,ze=be()*Math.PI*2,Oe=Math.cos(ze)*He*1.1,et=Math.sin(ze)*He-1.5;if(Math.abs(Oe-fn(et))<1.38||Math.sin(Oe*.55+1.1)*Math.cos(et*.48-.6)<-.15)continue;const Mt=ln(Oe,et);ve.position.set(Oe,Mt-.02,et),ve.rotation.set(0,be()*Math.PI*2,0),ve.scale.setScalar(.82+be()*.55),ve.updateMatrix(),N.setMatrixAt(G,ve.matrix);const pt=be();pt<.42?J.setRGB(.92,.74,.12):pt<.72?J.setRGB(.88,.88,.84):pt<.9?J.setRGB(.42,.36,.82):J.setRGB(.82,.28,.34),N.setColorAt(G,J),k[G*2+0]=be(),k[G*2+1]=.75+be()*.45,G++}N.count=G,N.instanceMatrix.needsUpdate=!0,N.instanceColor&&(N.instanceColor.needsUpdate=!0),b.setAttribute("aFlowerPhase",new Bn(k,2)),n.add(N);const te=new Ke({uniforms:t,transparent:!0,depthWrite:!1,blending:Pi,side:Bt,vertexShader:`
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-6, 0.0));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        vec3 V = safeNorm(cameraPosition - vWorldPos);
        vec3 N = safeNorm(vWorldNormal);

        // Smooth edge-on fade so volumetric plane edges are NEVER visible
        float viewFade = spow(abs(dot(N, V)), 1.35);
        float acrossFade = spow(sin(clamp(vUv.x, 0.0, 1.0) * 3.14159), 1.8);
        float lengthFade = smoothstep(0.0, 0.26, vUv.y) * smoothstep(1.0, 0.35, vUv.y);

        // Moving canopy gap streaks along the sunbeam axis
        float streak = fbm4(vec3(vUv.x * 5.5 + uTime * 0.08, vUv.y * 1.4 - uTime * 0.05, 1.7)) * 0.5 + 0.5;
        streak = smoothstep(0.28, 0.82, streak);

        float alpha = acrossFade * lengthFade * viewFade * streak * (0.048 + 0.015 * uIntensity + 0.028 * uSurge);
        vec3 rayCol = vec3(0.96, 0.78, 0.44) * alpha;
        gl_FragColor = vec4(rayCol, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),O=[{target:new D(-1.5,.4,-2),width:4.8,length:28,yaw:.25},{target:new D(2.8,.5,-5.5),width:5.6,length:30,yaw:-.35},{target:new D(-4.2,.8,-8.5),width:5.2,length:30,yaw:.65},{target:new D(.6,.3,2.5),width:4.2,length:26,yaw:-.15},{target:new D(5.8,.9,-10.5),width:6,length:32,yaw:.48}],he=e.clone(),Ae=new Yn,ee=new Yn,me=new D(0,1,0);for(const ie of O){const He=new en(ie.width,ie.length,1,1),ze=new ut(He,te);Ae.setFromUnitVectors(me,he),ee.setFromAxisAngle(he,ie.yaw),ze.quaternion.copy(ee).multiply(Ae),ze.position.copy(ie.target).addScaledVector(e,ie.length*.42),ze.renderOrder=6,n.add(ze)}const Ce=340,Ie=Fv(),Me=new Float32Array(Ce*4),Ye=new Float32Array(Ce*3),ne=new Ke({uniforms:t,side:Bt,vertexShader:`
      ${je}
      ${kt}
      attribute vec4 aLeafFlight;
      attribute vec3 aLeafOrigin;
      uniform float uTime;
      uniform float uLeafTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec4 uPointer;

      varying vec2 vLeafUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vLeafTint;

      void main() {
        vLeafUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vLeafTint = instanceColor;
        #else
          vLeafTint = vec3(0.42, 0.52, 0.14);
        #endif

        vec2 windDir = vec2(0.79, 0.613);
        vec2 crossDir = vec2(-0.613, 0.79);

        float cycle = fract(aLeafFlight.x + uLeafTime * aLeafFlight.y * 0.048);
        float span = aLeafFlight.w;

        // Drift naturally downwind across the valley while gliding & swooping in 3D eddies
        float travel = (cycle - 0.5) * span;
        float sway = sin(uTime * 1.45 + aLeafFlight.x * 31.4) * (1.2 + 0.8 * uSurge)
                   + cos(cycle * 12.56 + aLeafFlight.x * 17.0) * 0.65;

        vec2 worldXZ = aLeafOrigin.xz + windDir * travel + crossDir * sway;

        // Gentle aerodynamic flutter glide (leaves dip & bank side-to-side as they fall/rise on thermals)
        float glideOsc = sin(uTime * 2.8 + aLeafFlight.x * 40.0);
        float wy = aLeafOrigin.y + aLeafFlight.z * (1.0 - cycle * 0.45)
                 + glideOsc * 0.28
                 + uSurge * (0.65 + 0.45 * sin(uTime * 4.5 + aLeafFlight.x * 19.0));

        // Swirl upward when pointer passes nearby
        if (uPointer.w > 0.005) {
          vec2 dP = worldXZ - uPointer.xz;
          float distP = length(dP);
          float swirl = (1.0 - smoothstep(0.2, 3.2, distP)) * uPointer.w;
          worldXZ += safeNorm2(vec2(-dP.y, dP.x) + dP * 0.5) * swirl * 1.15;
          wy += swirl * 0.85;
        }

        // 3D aerodynamic banking, pitching & tumbling rotation matrix
        float tumbleA = uTime * (2.2 + 2.6 * uSurge) + aLeafFlight.x * 25.0 + glideOsc * 0.8;
        float bankA = glideOsc * 0.95 + uTime * 1.3;
        float ca = cos(tumbleA), sa = sin(tumbleA);
        float cb = cos(bankA), sb = sin(bankA);
        mat3 rot = mat3(
          ca * cb, sa, -ca * sb,
          -sa * cb, ca, sa * sb,
          sb, 0.0, cb
        );

        // Smooth scale fade at start/end of wind loop + refined 0.64x botanical leaf proportions
        float edgeEnv = smoothstep(0.0, 0.08, cycle) * smoothstep(1.0, 0.90, cycle);
        float leafScale = (0.54 + 0.28 * fract(aLeafFlight.x * 13.7)) * edgeEnv;

        vec3 wp = vec3(worldXZ.x, wy, worldXZ.y) + rot * (position * leafScale);
        vWorldPos = wp;
        vWorldNormal = safeNorm(rot * normal);

        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }
    `,fragmentShader:`
      ${je}
      ${kt}
      uniform float uSurge;
      uniform vec3 uSunDir;
      varying vec2 vLeafUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vLeafTint;

      void main() {
        // Tapered serrated botanical leaf silhouette cutout (never a diamond quad!)
        float t = clamp(vLeafUv.y, 0.0, 1.0);
        float across = abs(vLeafUv.x - 0.5) * 2.0;
        float serration = 1.0 + 0.14 * sin(t * 24.0);
        float maxW = sin(spow(t, 0.72) * 3.14159) * serration;
        if (across > maxW) discard;

        vec3 N = safeNorm(gl_FrontFacing ? vWorldNormal : -vWorldNormal);
        vec3 V = safeNorm(cameraPosition - vWorldPos);
        float sunDiff = max(dot(N, uSunDir), 0.0);
        float backGlow = spow(max(dot(-V, uSunDir), 0.0), 2.2) * 0.52;

        // Subtle sunlit central midrib vein
        float midrib = 1.0 - smoothstep(0.0, 0.14, across);
        vec3 leafAlbedo = mix(vLeafTint, vLeafTint * 1.28 + vec3(0.05, 0.04, 0.01), midrib * 0.55);

        vec3 lit = leafAlbedo * (
          vec3(0.26, 0.37, 0.52) * 0.62 +
          vec3(0.98, 0.82, 0.54) * (sunDiff * 1.18 + backGlow)
        );
        lit = applyMorningAerialHaze(lit, vWorldPos, cameraPosition, uSunDir, uSurge);
        gl_FragColor = vec4(min(lit, vec3(0.95)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),Se=new Ua(Ie,ne,Ce);Se.frustumCulled=!1;const L=la(9931);for(let ie=0;ie<Ce;ie++){ve.matrix.identity(),Se.setMatrixAt(ie,ve.matrix);const He=(L()-.5)*24,ze=(L()-.5)*24-3.5,Oe=ln(He,ze)+.65;Ye[ie*3+0]=He,Ye[ie*3+1]=Oe,Ye[ie*3+2]=ze,Me[ie*4+0]=L(),Me[ie*4+1]=.7+L()*.75,Me[ie*4+2]=.6+L()*3.2,Me[ie*4+3]=18+L()*14;const et=L();et<.45?J.setRGB(.2,.38,.08):et<.75?J.setRGB(.48,.46,.11):J.setRGB(.58,.32,.1),Se.setColorAt(ie,J)}Se.instanceMatrix.needsUpdate=!0,Se.instanceColor&&(Se.instanceColor.needsUpdate=!0),Ie.setAttribute("aLeafFlight",new Bn(Me,4)),Ie.setAttribute("aLeafOrigin",new Bn(Ye,3)),n.add(Se);const ae=1850,V=350,$=ae+V,oe=new Float32Array($*3),re=new Float32Array($*4);for(let ie=0;ie<$;ie++)if(ie<ae){const ze=Math.pow(L(),.72)*21,Oe=L()*Math.PI*2,et=Math.cos(Oe)*ze*1.15,Mt=Math.sin(Oe)*ze-2.5,pt=ln(et,Mt)+.28+Math.pow(L(),1.2)*4.2;oe[ie*3+0]=et,oe[ie*3+1]=pt,oe[ie*3+2]=Mt,re[ie*4+0]=L(),re[ie*4+1]=.25+L()*.45,re[ie*4+2]=1.8+Math.pow(L(),2)*2.8,re[ie*4+3]=1}else{const ze=-34+L()*52,Oe=fn(ze)+(L()-.5)*18,et=ln(Oe,ze)+.35+L()*1.15;oe[ie*3+0]=Oe,oe[ie*3+1]=et,oe[ie*3+2]=ze,re[ie*4+0]=L(),re[ie*4+1]=.12+L()*.18,re[ie*4+2]=42+L()*44,re[ie*4+3]=0}const ye=new st;ye.setAttribute("position",new De(oe,3)),ye.setAttribute("aAtmoData",new De(re,4));const We=new Ke({uniforms:t,transparent:!0,depthWrite:!1,vertexShader:`
      ${je}
      ${kt}
      attribute vec4 aAtmoData;
      uniform float uTime;
      uniform float uLeafTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uPixelRatio;
      uniform float uViewScale;
      uniform vec3 uSunDir;
      uniform vec4 uPointer;

      varying float vType;
      varying float vAlpha;
      varying float vSeed;
      varying float vSunScatter;

      void main() {
        vType = aAtmoData.w;
        vSeed = aAtmoData.x;
        vec2 windDir = vec2(0.79, 0.613);

        float life = fract(aAtmoData.x + uLeafTime * aAtmoData.y * 0.068);
        float env = sin(clamp(life, 0.0, 1.0) * 3.14159);

        vec3 p = position;
        if (vType > 0.5) {
          // Floating sunlit pollen & dandelion seed motes
          float driftSpan = 6.5 + 4.5 * uSurge;
          p.xz += windDir * ((life - 0.5) * driftSpan);
          p.x += sin(uTime * 0.85 + aAtmoData.x * 28.0) * 0.45;
          p.y += cos(uTime * 0.68 + aAtmoData.x * 35.0) * 0.32 + uSurge * 0.35 * env;
          p.z += cos(uTime * 0.76 + aAtmoData.x * 19.0) * 0.45;

          if (uPointer.w > 0.005) {
            vec2 dP = p.xz - uPointer.xz;
            float swirl = (1.0 - smoothstep(0.2, 2.8, length(dP))) * uPointer.w;
            p.xz += safeNorm2(dP) * swirl * 0.75;
            p.y += swirl * 0.45;
          }

          // Shimmer brightly inside slanted sunbeam lanes!
          float sunLane = sin(dot(p.xz, vec2(0.62, -0.78)) * 0.55 + p.y * 0.25) * 0.5 + 0.5;
          vAlpha = env * (0.32 + 0.58 * sunLane);
        } else {
          // Gentle valley morning mist drifting lazily above stream & turf
          p.xz += windDir * ((life - 0.5) * 9.0);
          p.y += sin(uTime * 0.35 + aAtmoData.x * 20.0) * 0.12;
          vAlpha = env * 0.052 * (1.0 - 0.25 * uSurge);
        }

        vec3 toPart = safeNorm(p - cameraPosition);
        vSunScatter = spow(max(dot(toPart, uSunDir), 0.0), 3.0);

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        float distScale = (12.0 * uViewScale) / max(-mvPos.z, 1.2);
        gl_PointSize = clamp(aAtmoData.z * uPixelRatio * distScale, 1.2, (vType > 0.5 ? 11.0 : 96.0) * uViewScale);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      ${je}
      varying float vType;
      varying float vAlpha;
      varying float vSeed;
      varying float vSunScatter;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;

        if (vType > 0.5) {
          float core = exp(-d * d * 24.0);
          float halo = exp(-d * d * 6.5) * 0.38;
          float g = (core + halo) * vAlpha;
          vec3 pollenCol = mix(vec3(0.85, 0.78, 0.48), vec3(1.02, 0.90, 0.62), core * 0.7 + vSunScatter * 0.3);
          gl_FragColor = vec4(pollenCol, clamp(g, 0.0, 0.88));
        } else {
          float wisp = smoothstep(0.5, 0.05, d);
          float cloudTex = 0.65 + 0.35 * snoise(vec3(uv * 3.8, vSeed * 15.0));
          float a = wisp * wisp * cloudTex * vAlpha;
          vec3 mistCol = mix(vec3(0.62, 0.74, 0.86), vec3(0.92, 0.82, 0.66), vSunScatter * 0.75 + 0.15);
          gl_FragColor = vec4(mistCol, a);
        }
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),Ne=new Vn(ye,We);Ne.frustumCulled=!1,Ne.renderOrder=5,n.add(Ne);let Ee=-1,Ge=0,Ze=0,rt=0,dt=0;const Ue=new D,ft=Ce+ae+V;return{name:"earth",title:"Earth · Sunlit Mountain Valley",subtitle:"Wind-Rippling Alpine Meadow, Mossy Crags & Ancient Oaks",description:"Golden morning sunbeams slant across layered alpine ridges into a granite mountain valley where 9,800 instanced grass blades and wildflowers ripple in travelling 2D Perlin wind waves alongside a clear pebble-bed meltwater stream, mossy crags, gnarled procedural oaks, tumbling leaves, and sunlit pollen.",stats:"9,800 Grass Blades · 6 Procedural Trees · 2,540 Leaves & Pollen",accent:"#56d17c",scene:n,defaultCamera:{position:new D(0,2.75,11.4),target:new D(0,1.55,-3.2),fov:46,minDistance:3.2,maxDistance:28,maxPolarAngle:Math.PI*.478},particleCount:ft,update(ie,He,ze,Oe=null){const et=Ee<0?.016:Math.min(Math.max(ie-Ee,0),.05);Ee=ie,Ge+=et*(2.05+.95*He+2.6*ze),Ze+=et*(.75+.45*He+1.45*ze),rt+=et*(1.35+.45*He+.85*ze),t.uTime.value=ie,t.uWindPhase.value=Ge,t.uLeafTime.value=Ze,t.uStreamFlow.value=rt,t.uIntensity.value=He,t.uSurge.value=ze,t.uViewScale.value=Oe?.activeView==="all"?.5:1;let Mt=0;if(Oe&&Oe.pointerActive&&Oe.pointerWorld){const pt=Oe.pointerWorld;if(Math.abs(pt.x)<32&&Math.abs(pt.z)<36){Mt=1;const Pt=dt<.02?1:1-Math.exp(-et*14);Ue.x+=(pt.x-Ue.x)*Pt,Ue.z+=(pt.z-Ue.z)*Pt,Ue.y=ln(Ue.x,Ue.z)+.35}}dt+=(Mt-dt)*(1-Math.exp(-et*8.5)),t.uPointer.value.set(Ue.x,Ue.y,Ue.z,dt)},onResize(ie){t.uPixelRatio.value=ie}}}const bn=`
vec3 safeNorm3(vec3 v) {
  float len2 = dot(v, v);
  return len2 > 1e-8 ? v * inversesqrt(len2) : vec3(0.0, 1.0, 0.0);
}

vec2 safeNorm2(vec2 v) {
  float len2 = dot(v, v);
  return len2 > 1e-8 ? v * inversesqrt(len2) : vec2(1.0, 0.0);
}

float safeAtan(float y, float x) {
  return (abs(x) + abs(y) > 1e-6) ? atan(y, x) : 0.0;
}

// Fast 2-octave FBM & Ridged helpers for 60 FPS Ultra shader throughput
float fbm2Fast(vec3 p) {
  return 0.65 * snoise(p) + 0.35 * snoise(p * 2.07 + vec3(3.1, -1.7, 2.3));
}

float ridged2Fast(vec3 p) {
  float n0 = 1.0 - abs(snoise(p));
  n0 *= n0;
  float n1 = 1.0 - abs(snoise(p * 2.13 + vec3(-2.4, 4.1, 1.8)));
  n1 *= n1 * clamp(n0 * 1.8, 0.0, 1.0);
  return n0 * 0.64 + n1 * 0.36;
}

// Henyey-Greenstein phase function for realistic cloud silver-lining forward scattering
float hgPhase(float cosTheta, float g) {
  float g2 = g * g;
  float denom = max(1.0 + g2 - 2.0 * g * cosTheta, 1e-4);
  return (1.0 - g2) / (4.0 * 3.14159265 * pow(denom, 1.5));
}

// Shared drifting cumulus cloud-shadow projection onto alpine mountain slopes (2-tap fast FBM)
float sampleAlpineCloudShadow(vec2 worldXZ, float worldY, vec3 sunDir, vec2 windOffset, float timeSlow) {
  float cloudDeckY = 14.2;
  float dy = max(cloudDeckY - worldY, 0.0);
  vec2 projXZ = worldXZ + (sunDir.xz / max(sunDir.y, 0.25)) * dy;
  vec2 sampleUV = projXZ * 0.042 - windOffset * 0.36;
  float raw = fbm2Fast(vec3(sampleUV, timeSlow * 0.04));
  return smoothstep(0.03, 0.46, raw);
}

// Physical Rayleigh + Mie high-altitude 4,200m alpine sky colour (<= 0.95 linear off-disc)
vec3 computeAlpineSkyColor(vec3 viewDir, vec3 sunDir, float surge, float sheetFlash, float sheetAzimuthCos) {
  float up = clamp(viewDir.y, -0.15, 1.0);
  float horizonMask = pow(max(1.0 - max(up, 0.0), 0.0), 3.8);

  // Crisp deep high-altitude sapphire zenith -> vibrant cerulean mid-sky -> clean glacier horizon
  vec3 zenithCol = mix(vec3(0.028, 0.095, 0.310), vec3(0.020, 0.062, 0.205), surge * 0.45);
  vec3 midSkyCol = mix(vec3(0.115, 0.315, 0.665), vec3(0.085, 0.225, 0.495), surge * 0.42);
  vec3 horizonCol = mix(vec3(0.460, 0.625, 0.820), vec3(0.320, 0.440, 0.615), surge * 0.45);

  vec3 sky = mix(midSkyCol, zenithCol, smoothstep(0.05, 0.58, max(up, 0.0)));
  sky = mix(sky, horizonCol, horizonMask);

  if (up < 0.0) {
    sky = mix(horizonCol, vec3(0.20, 0.29, 0.44), clamp(-up * 4.5, 0.0, 1.0));
  }

  // Forward Mie solar aureole & warm high-altitude sun glow
  float sunCos = clamp(dot(viewDir, sunDir), -1.0, 1.0);
  float mieWide = pow(max(sunCos, 0.0), 7.0) * (0.14 + 0.13 * horizonMask);
  float mieTight = pow(max(sunCos, 0.0), 46.0) * 0.24;
  sky += vec3(0.70, 0.64, 0.52) * mieWide + vec3(0.82, 0.76, 0.64) * mieTight * (1.0 - surge * 0.35);

  // Distant horizon sheet lightning illuminating storm cells during high-mountain gale surge
  if (sheetFlash > 0.002) {
    float stormBand = exp(-pow(max(abs(up - 0.065), 0.0) * 11.0, 2.0));
    float azAlign = smoothstep(0.15, 0.96, sheetAzimuthCos);
    sky += vec3(0.48, 0.65, 0.96) * sheetFlash * stormBand * azAlign * 0.88;
  }

  return sky;
}
`;function Xr(n=123456789){let e=n>>>0;return()=>(e=e*1664525+1013904223>>>0,e/4294967296)}const ai=(()=>{const n=new Uint8Array(512),e=new Uint8Array(256);for(let i=0;i<256;i++)e[i]=i;const t=Xr(40962026);for(let i=255;i>0;i--){const a=Math.floor(t()*(i+1)),r=e[i];e[i]=e[a],e[a]=r}for(let i=0;i<512;i++)n[i]=e[i&255];return n})();function Er(n,e,t){switch(n&7){case 0:return e+t;case 1:return-e+t;case 2:return e-t;case 3:return-e-t;case 4:return e*1.41421356;case 5:return-e*1.41421356;case 6:return t*1.41421356;default:return-t*1.41421356}}function zu(n,e){const t=Math.floor(n),i=Math.floor(e),a=n-t,r=e-i,o=t&255,s=i&255,l=a*a*a*(a*(a*6-15)+10),c=r*r*r*(r*(r*6-15)+10),f=ai[ai[o]+s],d=ai[ai[o]+s+1],h=ai[ai[o+1]+s],p=ai[ai[o+1]+s+1],g=Er(f,a,r)*(1-l)+Er(h,a-1,r)*l,x=Er(d,a,r-1)*(1-l)+Er(p,a-1,r-1)*l;return g*(1-c)+x*c}function Xo(n,e,t=4){let i=0,a=.5,r=n,o=e;for(let s=0;s<t;s++){i+=a*zu(r,o);const l=r*1.62+o*1.21+11.3,c=-r*1.21+o*1.62+7.9;r=l,o=c,a*=.5}return i}function Cr(n,e,t=5){let i=0,a=.52,r=1,o=n,s=e;for(let l=0;l<t;l++){let c=1-Math.abs(zu(o,s));c*=c,c*=r,r=Math.min(Math.max(c*1.88,0),1),i+=c*a;const f=o*1.66-s*1.24+5.7,d=s*1.66+o*1.24-9.1;o=f,s=d,a*=.48}return i}function Pr(n,e,t){const i=Math.min(Math.max((t-n)/(e-n),0),1);return i*i*(3-2*i)}function $i(n,e,t,i,a,r,o,s,l,c){const f=n-t+l*1.35,d=e-i+c*1.35,h=Math.hypot(f,d);if(h>=r*1.32)return 0;const p=Math.atan2(d,f)+o,g=.5+.5*Math.cos(p*s+l*.65),x=Math.pow(g,1.75),m=.88+.16*Math.sin(p+o*1.7),u=r*(.56+.68*x)*m,M=h/Math.max(u,.001);return M>=1?0:a*Math.pow(1-M,1.52)*(.86+.22*x)}function Rr(n,e,t,i,a,r,o,s,l,c,f){const d=a-t,h=r-i,p=n-t+c*.9,g=e-i+f*.9,x=d*d+h*h,m=x>1e-6?Math.min(Math.max((p*d+g*h)/x,0),1):0,u=p-m*d,M=g-m*h,S=Math.hypot(u,M);if(S>=s)return 0;const v=Math.sin(m*Math.PI),T=Math.pow(1-S/s,1.55),w=.76+.36*l;return o*T*(.35+.65*v)*w}function Mi(n,e){const t=Math.hypot(n,e),i=Xo(n*.055+3.1,e*.055-2.4,3),a=Xo(n*.055-5.7,e*.055+4.8,3),r=Cr(n*.082+2.4,e*.082-1.7,5),o=Cr(n*.22-4.1,e*.22+3.3,4);let l=-2.25+Xo(n*.04,e*.04,3)*.95+r*.85;const c=$i(n,e,-3.4,-20.5,11.8,12.8,.42,4,i,a),f=$i(n,e,-11.8,-11.2,9.2,10.2,1.05,3,i,a),d=$i(n,e,10.4,-14.2,10.2,11.6,-.58,4,i,a),h=$i(n,e,15.2,-7.2,8.2,8.8,.85,3,i,a);let p=Math.max(c,f,d,h);p=Math.max(p,Rr(n,e,-11.8,-11.2,-3.4,-20.5,6.8,6.4,r,i,a),Rr(n,e,-11.8,-11.2,-16.5,-2.5,5.4,5.8,r,i,a),Rr(n,e,10.4,-14.2,15.2,-7.2,6.4,5.8,r,i,a),Rr(n,e,10.4,-14.2,4.2,-19.5,5.2,5.6,r,i,a)),p>.01&&(l+=p*(.82+.28*r)+Pr(1.5,7,p)*(o-.38)*1.25);const g=$i(n,e,-10.2,9.2,4.2,6.8,.3,3,i,a),x=$i(n,e,9.6,9.6,3.8,6.5,-.4,3,i,a);l+=Math.max(g,x)*(.8+.28*o);const m=Math.exp(-((n-1.6)*(n-1.6))*.055)*Math.exp(-((e+4)*(e+4))*.0032);l-=m*1.15;const u=Math.exp(-((n-.8)*(n-.8)+(e-18.5)*(e-18.5))*.045);l=l*(1-.75*u)+-1.2*(.75*u);const M=Pr(28,52,t)*(1-Pr(78,94,t));if(M>.001){const S=Cr(n*.045+8.2,e*.045-6.4,5),v=Cr(n*.11-3.4,e*.11+5.1,3),T=.62+.38*Math.abs(Math.sin(Math.atan2(e,n)*2.5+.9)),w=1-.35*Math.exp(-(n-2)*(n-2)*.012)*Pr(-20,-45,e);l+=M*w*(3.5+11.2*Math.pow(S,1.25)+1.8*v)*T}return l}function Uv(n){let e=0,t=0;const i=Object.keys(n[0].attributes);for(const c of n)e+=c.attributes.position.count,t+=c.index?c.index.count:c.attributes.position.count;const a=new st;for(const c of i){const f=n[0].attributes[c].itemSize,d=new Float32Array(e*f);let h=0;for(const p of n){const g=p.attributes[c];d.set(g.array,h),h+=g.array.length}a.setAttribute(c,new De(d,f))}const r=e>65535?Uint32Array:Uint16Array,o=new r(t);let s=0,l=0;for(const c of n){const f=c.attributes.position.count;if(c.index){const d=c.index.array;for(let h=0;h<d.length;h++)o[s++]=d[h]+l}else for(let d=0;d<f;d++)o[s++]=d+l;l+=f}return a.setIndex(new De(o,1)),a}function zv(){const n=[],e=[],t=[];function i(M,S,v,T,w){const E=n.length/3;return n.push(M,S,v),e.push(T,w),E}function a(M,S,v){t.push(M,S,v)}const r=i(0,.005,.225,0,.2),o=i(0,.028,.13,0,.34),s=i(0,-.025,.08,0,.56),l=i(-.034,.006,.038,-.05,.38),c=i(.034,.006,.038,.05,.38),f=i(0,.024,-.058,0,.32),d=i(0,-.017,-.068,0,.52),h=i(0,.008,-.148,0,.28),p=i(-.062,.006,-.285,-.06,.22),g=i(0,.008,-.305,0,.25),x=i(.062,.006,-.285,.06,.22);a(r,c,o),a(r,o,l),a(r,s,c),a(r,l,s),a(o,c,f),a(o,f,l),a(s,d,c),a(s,l,d),a(f,c,h),a(f,h,l),a(d,h,c),a(d,l,h),a(h,x,g),a(h,g,p),a(h,g,x),a(h,p,g);const m=[{span:.03,zLead:.088,zTrail:-.078,yCamber:.014,thick:.01,frac:.05,tone:.42},{span:.195,zLead:.076,zTrail:-.068,yCamber:.024,thick:.008,frac:.34,tone:.64},{span:.385,zLead:.044,zTrail:-.062,yCamber:.022,thick:.005,frac:.68,tone:.74},{span:.565,zLead:-.038,zTrail:-.098,yCamber:.008,thick:.003,frac:1,tone:.2}];for(const M of[-1,1]){const S=[];for(let v=0;v<m.length;v++){const T=m[v],w=M*T.span,E=M*T.frac,C=i(w,T.yCamber,T.zLead,E,T.tone),y=i(w,T.yCamber+T.thick,(T.zLead+T.zTrail)*.52,E,T.tone*.85),_=i(w,T.yCamber-T.thick,(T.zLead+T.zTrail)*.52,E,T.tone*1.25),P=i(w,T.yCamber-.003,T.zTrail,E,T.tone*.78);S.push({lead:C,midTop:y,midBot:_,trail:P})}for(let v=0;v<S.length-1;v++){const T=S[v],w=S[v+1];M>0?(a(T.lead,w.lead,w.midTop),a(T.lead,w.midTop,T.midTop),a(T.midTop,w.midTop,w.trail),a(T.midTop,w.trail,T.trail),a(T.lead,w.midBot,w.lead),a(T.lead,T.midBot,w.midBot),a(T.midBot,w.trail,w.midBot),a(T.midBot,T.trail,w.trail)):(a(T.lead,w.midTop,w.lead),a(T.lead,T.midTop,w.midTop),a(T.midTop,w.trail,w.midTop),a(T.midTop,T.trail,w.trail),a(T.lead,w.lead,w.midBot),a(T.lead,w.midBot,T.midBot),a(T.midBot,w.midBot,w.trail),a(T.midBot,T.trail,w.trail))}}const u=new st;return u.setAttribute("position",new De(new Float32Array(n),3)),u.setAttribute("aWingCoord",new De(new Float32Array(e),2)),u.setIndex(t),u.computeVertexNormals(),u}function Ov(){const n=new Ka;n.background=new lt(5799592),n.fog=new no(7247038,.0055);const e=new D(.62,.46,-.635).normalize(),t=new Le(.88,.475).normalize(),i=new ro(16774628,2.2);i.position.copy(e).multiplyScalar(70),n.add(i);const a=new ao(8303871,2898768,.95);n.add(a);const r={uTime:{value:0},uWindPhase:{value:0},uIntensity:{value:1},uSurge:{value:0},uSheetFlash:{value:0},uSheetDir:{value:new Le(-.35,-.93)},uSunDir:{value:e.clone()},uWindDir:{value:t.clone()},uWindOffset:{value:new Le(0,0)},uPointerWorld:{value:new D(0,-100,0)},uPointerActive:{value:0},uViewportScale:{value:.52},uPixelRatio:{value:Math.min(typeof window<"u"&&window.devicePixelRatio||1,2)}},o=new ya(240,56,36),s=new Ke({uniforms:r,side:Lt,depthWrite:!1,vertexShader:`
      varying vec3 vWorldOffset;
      void main() {
        vWorldOffset = position;
        vec4 mvPos = viewMatrix * vec4(cameraPosition + position, 1.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      ${je}
      ${bn}
      uniform float uTime;
      uniform float uSurge;
      uniform float uSheetFlash;
      uniform vec2 uSheetDir;
      uniform vec3 uSunDir;
      uniform vec2 uWindOffset;

      varying vec3 vWorldOffset;

      void main() {
        vec3 dir = safeNorm3(vWorldOffset);
        vec2 flatDir = safeNorm2(dir.xz);
        float sheetAzCos = dot(flatDir, uSheetDir);

        vec3 col = computeAlpineSkyColor(dir, uSunDir, uSurge, uSheetFlash, sheetAzCos);

        // High-altitude wind-sheared cirrus mares'-tails & jet-stream cirrostratus wisps
        if (dir.y > 0.03) {
          vec2 skyPlane = dir.xz / (dir.y + 0.20);
          float planeLen = length(skyPlane);
          if (planeLen < 10.2) {
            mat2 windBasis = mat2(0.88, -0.475, 0.475, 0.88);
            vec2 cirrusUV = windBasis * skyPlane;
            vec2 drift = vec2(uWindOffset.x * 0.25, uWindOffset.y * 0.07);

            float c1 = fbm2Fast(vec3(cirrusUV.x * 0.28 - drift.x, cirrusUV.y * 1.25 - drift.y, uTime * 0.015));
            float wisps = ridged2Fast(vec3(cirrusUV.x * 0.62 - drift.x * 1.35 + c1 * 0.45, cirrusUV.y * 2.5, uTime * 0.02));
            float cirrusMask = smoothstep(0.06, 0.56, c1 * 0.64 + wisps * 0.44 - 0.12)
              * smoothstep(0.03, 0.22, dir.y)
              * (1.0 - smoothstep(4.8, 10.0, planeLen));

            float sunCos = clamp(dot(dir, uSunDir), -1.0, 1.0);
            float silver = hgPhase(sunCos, 0.55) * 0.38;
            vec3 cirrusCol = mix(vec3(0.70, 0.78, 0.90), vec3(0.94, 0.92, 0.88), clamp(0.38 + silver, 0.0, 1.0));
            col = mix(col, cirrusCol, cirrusMask * (0.38 + 0.16 * uSurge));
          }
        }

        // Crisp high-altitude solar disc (ONLY the solar disc crosses bloom threshold 1.05!)
        float sunCos = dot(dir, uSunDir);
        float sunDisc = smoothstep(0.99915, 0.99968, sunCos);
        float sunLimb = smoothstep(0.9972, 0.9993, sunCos) * 0.28;
        col += vec3(1.55, 1.44, 1.24) * sunDisc * (1.0 - uSurge * 0.25);
        col += vec3(0.75, 0.68, 0.55) * sunLimb;

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),l=new ut(o,s);l.frustumCulled=!1,l.renderOrder=1,n.add(l);const c=192,f=216,d=new en(c,c,f,f);d.rotateX(-Math.PI/2);const h=d.attributes.position.array,p=f+1,g=new Float32Array(p*p);for(let J=0;J<p*p;J++){const ce=h[J*3+0],ge=h[J*3+2],pe=Mi(ce,ge);h[J*3+1]=pe,g[J]=pe}const x=new Float32Array(p*p),m=[];for(let J=0;J<p;J++){const ce=Math.max(0,J-1),ge=Math.min(p-1,J+1);for(let pe=0;pe<p;pe++){const R=Math.max(0,pe-1),b=Math.min(p-1,pe+1),k=J*p+pe,Q=g[k],N=g[J*p+R],G=g[J*p+b],te=g[ce*p+pe],O=g[ge*p+pe],he=.25*(N+G+te+O),Ae=Math.min(Math.max((he-Q)*2.2,-1.4),1.4);x[k]=Ae;const ee=h[k*3+0],me=h[k*3+2];Q>3.2&&Ae<-.09&&Math.abs(ee)<20&&me>-27&&me<4&&m.push(new D(ee,Q,me))}}m.length<16&&(m.push(new D(-3.4,Mi(-3.4,-20.5),-20.5)),m.push(new D(-11.8,Mi(-11.8,-11.2),-11.2)),m.push(new D(10.4,Mi(10.4,-14.2),-14.2))),d.setAttribute("aConcavity",new De(x,1)),d.computeVertexNormals();const u=new Ke({uniforms:r,vertexShader:`
      attribute float aConcavity;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vConcavity;

      void main() {
        vConcavity = aConcavity;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = mat3(modelMatrix) * normal;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,fragmentShader:`
      ${je}
      ${bn}
      uniform float uTime;
      uniform float uSurge;
      uniform float uSheetFlash;
      uniform vec2 uSheetDir;
      uniform vec3 uSunDir;
      uniform vec2 uWindDir;
      uniform vec2 uWindOffset;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vConcavity;

      // Multi-scale chiseled alpine granite strata & angular dihedral fracture relief (4 fast snoise taps)
      float evalGraniteRelief(vec3 p) {
        float warp = snoise(p * 0.34) * 1.40;
        // Tilted geological bedding ledges + sharp vertical dihedral joints
        float strataPhase = p.y * 3.8 + p.x * 0.72 - p.z * 0.48 + warp;
        float strataLedge = sin(strataPhase) * 0.5 + 0.5;
        strataLedge = pow(max(strataLedge, 0.0), 1.65);

        float cragMacro = ridged2Fast(p * 0.68 + vec3(0.0, warp * 0.35, 0.0));
        float cragFine = 1.0 - abs(snoise(p * 2.18 + vec3(4.3, -1.8, 2.7)));
        cragFine *= cragFine;
        return cragMacro * 0.54 + cragFine * 0.28 + strataLedge * 0.26;
      }

      // Wind-fluted alpine sastrugi snow micro-relief (2 fast snoise taps)
      float evalSnowSastrugi(vec3 p, vec2 windDir) {
        vec2 perp = vec2(-windDir.y, windDir.x);
        vec3 wp = vec3(dot(p.xz, windDir) * 0.95, p.y * 0.8, dot(p.xz, perp) * 2.85);
        float sRidge = 1.0 - abs(snoise(wp * 1.35));
        sRidge *= sRidge;
        return sRidge * 0.65 + snoise(wp * 3.8) * 0.35;
      }

      void main() {
        vec3 baseN = safeNorm3(vWorldNormal);
        vec3 toCam = cameraPosition - vWorldPos;
        float camDist = length(toCam);
        vec3 viewDir = safeNorm3(toCam);

        // Keep sharp crag bump detail crisp across foreground AND midground peaks (up to 72m!)
        float bumpFade = 1.0 - smoothstep(26.0, 76.0, camDist);

        // Orthonormal surface tangent basis so we need ONLY 2 tangent samples instead of 3!
        vec3 refAxis = abs(baseN.y) < 0.92 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 tang1 = safeNorm3(cross(refAxis, baseN));
        vec3 tang2 = cross(baseN, tang1);

        float eps = 0.055;
        float h0 = evalGraniteRelief(vWorldPos);
        vec3 rockTangentGrad = vec3(0.0);
        if (bumpFade > 0.01) {
          float h1 = evalGraniteRelief(vWorldPos + tang1 * eps);
          float h2 = evalGraniteRelief(vWorldPos + tang2 * eps);
          rockTangentGrad = (tang1 * (h1 - h0) + tang2 * (h2 - h0)) / eps;
        }

        // Physically realistic snow accumulation: sticks on gentler ledges, concave couloirs & lee pockets,
        // while steep vertical crags & sharp convex arête ribs jut out as bare dark fractured granite!
        float altSnow = smoothstep(-0.8, 5.2, vWorldPos.y);
        float snowScore =
          baseN.y * 0.94 +
          vConcavity * 0.48 +
          altSnow * 0.19 -
          (h0 - 0.48) * 0.38;
        // Crisp natural rock-to-snow boundary (not blurry vertex paint!)
        float snowMask = smoothstep(0.555, 0.625, snowScore);

        // Evaluate wind-sastrugi snow normal ONLY on snow-covered slopes (0 cost on bare granite!)
        float s0 = 0.5;
        vec3 snowTangentGrad = vec3(0.0);
        if (snowMask > 0.008) {
          s0 = evalSnowSastrugi(vWorldPos, uWindDir);
          if (bumpFade > 0.01) {
            float s1 = evalSnowSastrugi(vWorldPos + tang1 * 0.08, uWindDir);
            float s2 = evalSnowSastrugi(vWorldPos + tang2 * 0.08, uWindDir);
            snowTangentGrad = (tang1 * (s1 - s0) + tang2 * (s2 - s0)) / 0.08;
          }
        }

        vec3 rockN = safeNorm3(baseN - rockTangentGrad * (0.42 * bumpFade));
        vec3 snowN = safeNorm3(baseN - snowTangentGrad * (0.11 * bumpFade));
        vec3 n = safeNorm3(mix(rockN, snowN, snowMask));

        // Stratified dark charcoal gneiss, weathered grey granite & sunlit ochre-feldspar veins
        float creviceAO = smoothstep(0.18, 0.72, h0);
        vec3 abyssCharcoal = vec3(0.022, 0.026, 0.036);
        vec3 coldGneiss = vec3(0.095, 0.105, 0.122);
        vec3 warmGranite = vec3(0.215, 0.192, 0.168);
        vec3 alpineTundra = vec3(0.072, 0.098, 0.062);

        vec3 rockAlbedo = mix(abyssCharcoal, coldGneiss, creviceAO);
        rockAlbedo = mix(rockAlbedo, warmGranite, smoothstep(0.52, 0.92, h0) * 0.58);
        float lowLichen = (1.0 - smoothstep(-0.8, 1.35, vWorldPos.y)) * smoothstep(0.56, 0.84, baseN.y);
        rockAlbedo = mix(rockAlbedo, alpineTundra, lowLichen * 0.45);

        // Crisp alpine snow & glacial firn albedo (<= 0.84 linear so sunlit snow retains sastrugi texture!)
        vec3 snowAlbedo = mix(vec3(0.68, 0.74, 0.83), vec3(0.82, 0.84, 0.88), clamp(s0 * 0.65, 0.0, 1.0));
        vec3 albedo = mix(rockAlbedo, snowAlbedo, snowMask);

        // Direct sunlight + gliding cumulus cloud shadows across the mountain faces!
        float cloudShadow = sampleAlpineCloudShadow(vWorldPos.xz, vWorldPos.y, uSunDir, uWindOffset, uTime);
        float sunShadowMask = (1.0 - cloudShadow * 0.58) * (1.0 - uSurge * 0.24);
        float sunDiff = max(dot(n, uSunDir), 0.0) * sunShadowMask;

        // Deep cerulean alpine sky-shadow fill + couloir ambient occlusion
        float skyHemi = n.y * 0.5 + 0.5;
        float gullyAO = clamp(1.0 - max(vConcavity, 0.0) * 0.25, 0.68, 1.0) * mix(0.68 + 0.32 * creviceAO, 1.0, snowMask);
        vec3 shadowFill = mix(vec3(0.075, 0.120, 0.215), vec3(0.185, 0.300, 0.495), skyHemi) * gullyAO;

        vec3 sunColor = vec3(1.06, 0.97, 0.86);
        vec3 lit = albedo * (shadowFill + sunColor * sunDiff * 0.96);

        // Fresh alpine snow crystal glint & grazing granite specular
        vec3 halfVec = safeNorm3(uSunDir + viewDir);
        float spec = pow(max(dot(n, halfVec), 0.0), mix(24.0, 56.0, snowMask)) * sunShadowMask;
        lit += mix(vec3(0.10, 0.11, 0.13), vec3(0.30, 0.33, 0.38), snowMask) * spec * 0.55;

        // Crystal-clear high-altitude air near foreground/midground peaks (< 26m zero washout!),
        // transitioning smoothly into Rayleigh blue aerial perspective on distant mountain ranges
        float hazeDist = max(camDist - 25.0, 0.0);
        float fogAmount = 1.0 - exp(-pow(max(hazeDist * 0.0112, 0.0), 1.32));
        vec3 horizView = safeNorm3(vec3(-viewDir.x, max(-viewDir.y, 0.025), -viewDir.z));
        float sheetAzCos = dot(safeNorm2(horizView.xz), uSheetDir);
        vec3 aerialColor = computeAlpineSkyColor(horizView, uSunDir, uSurge, uSheetFlash, sheetAzCos);
        lit = mix(lit, aerialColor, clamp(fogAmount, 0.0, 0.92));

        gl_FragColor = vec4(lit, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),M=new ut(d,u);n.add(M);function S(J,ce,ge,pe,R){const Q=new en(160,160,92,92);Q.rotateX(-Math.PI/2);const N=Q.attributes.position.array,G=Q.attributes.position.count,te=new Float32Array(G);for(let Ae=0;Ae<G;Ae++){const ee=N[Ae*3+0],me=N[Ae*3+2];N[Ae*3+1]=J,te[Ae]=Mi(ee,me)}Q.setAttribute("aTerrainY",new De(te,1));const O=new Ke({uniforms:{...r,uSpeedMul:{value:ce},uDeckOpacity:{value:ge},uScaleFreq:{value:pe}},transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
        ${je}
        ${bn}
        attribute float aTerrainY;
        uniform float uTime;
        uniform float uSurge;
        uniform float uSpeedMul;
        uniform float uScaleFreq;
        uniform vec2 uWindOffset;

        varying vec3 vWorldPos;
        varying float vTerrainY;
        varying float vBillow;

        void main() {
          vTerrainY = aTerrainY;
          vec3 p = position;
          vec2 driftUV = p.xz * uScaleFreq - uWindOffset * uSpeedMul;
          float wave = fbm2Fast(vec3(driftUV, uTime * 0.042));
          vBillow = wave;

          p.y += wave * (0.58 + 0.18 * uSurge);

          vec4 worldPos = modelMatrix * vec4(p, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,fragmentShader:`
        ${je}
        ${bn}
        uniform float uTime;
        uniform float uSurge;
        uniform float uSheetFlash;
        uniform vec2 uSheetDir;
        uniform float uSpeedMul;
        uniform float uDeckOpacity;
        uniform float uScaleFreq;
        uniform vec3 uSunDir;
        uniform vec2 uWindOffset;

        varying vec3 vWorldPos;
        varying float vTerrainY;
        varying float vBillow;

        void main() {
          // Wide soft shoreline fade where valley cloud sea laps against rocky mountain bases!
          float clearance = vWorldPos.y - vTerrainY;
          if (clearance <= 0.04) discard;
          float shoreFade = smoothstep(0.04, 1.38, clearance);

          float distCenter = length(vWorldPos.xz);
          float outerFade = 1.0 - smoothstep(48.0, 78.0, distCenter);
          if (outerFade <= 0.005) discard;

          vec2 uv = vWorldPos.xz * (uScaleFreq * 1.85) - uWindOffset * (uSpeedMul * 1.3);
          float f1 = fbm2Fast(vec3(uv, uTime * 0.055));
          float densityNoise = f1 * 0.72 + vBillow * 0.44;

          float cloudMask = smoothstep(-0.20, 0.46, densityNoise);
          float alpha = cloudMask * shoreFade * outerFade * uDeckOpacity * (1.0 + 0.14 * uSurge);
          if (alpha < 0.008) discard;

          // Lightweight directional derivative toward sun for sunlit cotton billows vs cool blue troughs
          vec2 sunStep = safeNorm2(uSunDir.xz) * 0.36;
          float sAhead = snoise(vec3((uv + sunStep) * 1.35, uTime * 0.055));
          float slopeLit = clamp(0.58 + (f1 - sAhead) * 1.25 + vBillow * 0.38, 0.0, 1.0);

          vec3 toCam = cameraPosition - vWorldPos;
          vec3 viewDir = safeNorm3(toCam);
          float cosSun = dot(-viewDir, uSunDir);
          float silver = hgPhase(cosSun, 0.58) * (1.0 - cloudMask * 0.52);

          vec3 bellyCol = mix(vec3(0.20, 0.31, 0.48), vec3(0.13, 0.20, 0.33), uSurge * 0.55);
          vec3 midCloud = vec3(0.55, 0.65, 0.78);
          vec3 sunlitTop = vec3(0.89, 0.90, 0.93);

          vec3 col = mix(bellyCol, midCloud, smoothstep(0.10, 0.52, slopeLit));
          col = mix(col, sunlitTop, smoothstep(0.45, 0.88, slopeLit) * (1.0 - uSurge * 0.18));
          col += vec3(0.92, 0.90, 0.86) * min(silver * 0.36, 0.30);

          float camDist = length(toCam);
          float hazeDist = max(camDist - 22.0, 0.0);
          float fogAmt = 1.0 - exp(-pow(max(hazeDist * 0.0115, 0.0), 1.28));
          vec3 horizDir = safeNorm3(vec3(-viewDir.x, 0.03, -viewDir.z));
          vec3 hazeCol = computeAlpineSkyColor(horizDir, uSunDir, uSurge, uSheetFlash, dot(safeNorm2(horizDir.xz), uSheetDir));
          col = mix(col, hazeCol, clamp(fogAmt, 0.0, 0.92));

          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.88));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `}),he=new ut(Q,O);return he.renderOrder=R,n.add(he),he}S(-.82,.48,.84,.082,3);const v=56,T=[],w=Xr(88442211);for(let J=0;J<v;J++){const ce=J>=38,ge=new en(1,1),pe=ge.attributes.position.count,R=new Float32Array(pe*4),b=new Float32Array(pe*4);let k,Q,N,G,te,O;ce?(k=w(),Q=(w()-.5)*38,N=.35+w()*2.15,G=.013+w()*.01,te=5.6+w()*3.4,O=te*(.46+w()*.14)):(k=w(),Q=J<24?(w()-.5)*11.5:(w()-.5)*26,N=-.6+w()*1.38,G=.018+w()*.013,te=4.2+w()*2.8,O=te*(.48+w()*.15));const he=w()*30,Ae=ce?1:0;for(let ee=0;ee<pe;ee++)R[ee*4+0]=k,R[ee*4+1]=Q,R[ee*4+2]=N,R[ee*4+3]=G,b[ee*4+0]=te,b[ee*4+1]=O,b[ee*4+2]=he,b[ee*4+3]=Ae;ge.setAttribute("aAnchor",new De(R,4)),ge.setAttribute("aShape",new De(b,4)),T.push(ge)}const E=Uv(T);for(const J of T)J.dispose();const C=new Ke({uniforms:r,transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
      ${je}
      ${bn}
      attribute vec4 aAnchor; // [initAlong, crossOffset, baseY, speedRate]
      attribute vec4 aShape;  // [width, height, seed, isFarColFlag]

      uniform float uTime;
      uniform float uWindPhase;
      uniform float uSurge;
      uniform vec2 uWindDir;

      varying vec2 vUv;
      varying float vSeed;
      varying float vIsFarCol;
      varying float vCorridorFade;
      varying vec3 vWorldCenter;
      varying vec3 vWorldPos;

      void main() {
        vUv = uv;
        vSeed = aShape.z;
        vIsFarCol = aShape.w;

        float corridorSpan = vIsFarCol > 0.5 ? 58.0 : 48.0;
        float progress = fract(aAnchor.x + uWindPhase * aAnchor.w);
        vCorridorFade = sin(progress * 3.14159265);

        float alongDist = (progress - 0.5) * corridorSpan;
        vec2 perpDir = vec2(-uWindDir.y, uWindDir.x);
        vec2 baseHub = vIsFarCol > 0.5 ? vec2(0.0, -30.0) : vec2(1.0, -10.5);
        vec2 centerXZ = baseHub + uWindDir * alongDist + perpDir * aAnchor.y;

        // Potential-flow deflection so valley cumulus banks part naturally around all 4 pyramidal peaks!
        if (vIsFarCol < 0.5) {
          vec2 d1 = centerXZ - vec2(-3.4, -20.5);
          float r1 = dot(d1, d1);
          if (r1 < 64.0) centerXZ += safeNorm2(d1) * (64.0 - r1) * 0.088;

          vec2 d2 = centerXZ - vec2(-11.8, -11.2);
          float r2 = dot(d2, d2);
          if (r2 < 48.0) centerXZ += safeNorm2(d2) * (48.0 - r2) * 0.088;

          vec2 d3 = centerXZ - vec2(10.4, -14.2);
          float r3 = dot(d3, d3);
          if (r3 < 56.0) centerXZ += safeNorm2(d3) * (56.0 - r3) * 0.088;

          vec2 d4 = centerXZ - vec2(15.2, -7.2);
          float r4 = dot(d4, d4);
          if (r4 < 38.0) centerXZ += safeNorm2(d4) * (38.0 - r4) * 0.085;
        }

        float bobY = sin(uTime * 0.42 + vSeed) * 0.12;
        vec3 center = vec3(centerXZ.x, aAnchor.z + bobY, centerXZ.y);
        vWorldCenter = center;

        vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

        float w = aShape.x * (1.0 + 0.08 * uSurge);
        float h = aShape.y * (1.0 + 0.06 * uSurge);
        vec3 worldPos = center + camRight * ((uv.x - 0.5) * w) + camUp * ((uv.y - 0.5) * h);
        vWorldPos = worldPos;

        gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
      }
    `,fragmentShader:`
      ${je}
      ${bn}
      uniform float uTime;
      uniform float uSurge;
      uniform float uSheetFlash;
      uniform vec2 uSheetDir;
      uniform vec3 uSunDir;

      varying vec2 vUv;
      varying float vSeed;
      varying float vIsFarCol;
      varying float vCorridorFade;
      varying vec3 vWorldCenter;
      varying vec3 vWorldPos;

      void main() {
        vec2 p = vUv - 0.5;
        // Strict early box & radial margin well inside [-0.5, 0.5] so ZERO quad edges/corners ever exist!
        float boxMax = max(abs(p.x), abs(p.y));
        if (boxMax >= 0.415) discard;

        // Smooth C1 cumulus aspect squash (flatter condensation base, domed cauliflower top, zero kink)
        float smoothSquash = mix(1.26, 1.02, smoothstep(-0.26, 0.22, p.y));
        vec2 qEllip = vec2(p.x * 1.08, p.y * smoothSquash);
        float dBase = length(qEllip);
        if (dBase >= 0.398) discard;

        // Fast 3-tap domain-warped FBM cumulus billows warping the silhouette organically
        vec3 nCoord = vec3(p.x * 3.4, p.y * 2.8, vSeed + uTime * 0.045);
        float warp = snoise(nCoord * 1.45 + vec3(1.9, -2.3, 0.7)) * 0.26;
        float cloudField = fbm2Fast(nCoord + warp) * 0.5 + 0.5;

        float dWarped = dBase + (0.5 - cloudField) * 0.14;
        // Reaches exact mathematical 0.0 before dBase=0.39 and boxMax=0.41!
        float edgeEnvelope = smoothstep(0.385, 0.10, dWarped) * smoothstep(0.41, 0.21, boxMax);
        float rawDensity = edgeEnvelope * smoothstep(0.22, 0.72, cloudField * (0.54 + 0.74 * edgeEnvelope));
        if (rawDensity < 0.008) discard;

        vec3 toCam = cameraPosition - vWorldPos;
        float camDist = length(toCam);
        float nearFade = smoothstep(2.4, 7.0, camDist);
        float alpha = rawDensity * vCorridorFade * nearFade * (vIsFarCol > 0.5 ? 0.44 : 0.48) * (1.0 + 0.12 * uSurge);
        if (alpha < 0.008) discard;

        // 3D volumetric cloud billow normal + Henyey-Greenstein sunlit silver lining!
        vec3 puffLocalN = safeNorm3(vec3(p.x * 1.75, p.y * 2.05 + 0.30, 0.55));
        float sunLightTerm = clamp(dot(puffLocalN, uSunDir) * 0.5 + 0.5, 0.0, 1.0);
        float topGrad = clamp(p.y + 0.54 + (cloudField - 0.5) * 0.32, 0.0, 1.0);
        float lit = clamp(topGrad * 0.64 + sunLightTerm * 0.46, 0.0, 1.0);

        vec3 rayDir = safeNorm3(vWorldPos - cameraPosition);
        float cosSun = dot(rayDir, uSunDir);
        float thinRim = pow(max(1.0 - rawDensity * 0.78, 0.0), 2.1) * smoothstep(0.03, 0.36, rawDensity);
        float silverLining = thinRim * (0.32 + hgPhase(cosSun, 0.62) * 0.58);

        vec3 shadowBelly = mix(vec3(0.19, 0.30, 0.47), vec3(0.12, 0.18, 0.31), uSurge * 0.6);
        vec3 midSlate = vec3(0.52, 0.63, 0.77);
        vec3 sunlitCrest = vec3(0.90, 0.91, 0.94);

        vec3 col = mix(shadowBelly, midSlate, smoothstep(0.10, 0.52, lit));
        col = mix(col, sunlitCrest, smoothstep(0.44, 0.88, lit) * (1.0 - uSurge * 0.18));
        col += vec3(0.94, 0.92, 0.88) * min(silverLining, 0.36);

        if (uSheetFlash > 0.002) {
          float azAlign = smoothstep(0.1, 0.95, dot(safeNorm2(vWorldCenter.xz), uSheetDir));
          col += vec3(0.44, 0.60, 0.94) * uSheetFlash * azAlign * (1.0 - topGrad * 0.5) * 0.55;
        }

        float hazeDist = max(camDist - 24.0, 0.0);
        float fogAmt = 1.0 - exp(-pow(max(hazeDist * 0.010, 0.0), 1.25));
        vec3 hazeCol = computeAlpineSkyColor(safeNorm3(vec3(rayDir.x, max(rayDir.y, 0.03), rayDir.z)), uSunDir, uSurge, uSheetFlash, dot(safeNorm2(rayDir.xz), uSheetDir));
        col = mix(col, hazeCol, clamp(fogAmt, 0.0, 0.88));

        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),y=new ut(E,C);y.frustumCulled=!1,y.renderOrder=5,n.add(y);const _=20,P=zv(),I=new Float32Array(_*4),F=new Bn(I,4);F.setUsage(bd),P.setAttribute("aBirdAnim",F);const X=new Ke({uniforms:r,side:Bt,vertexShader:`
      ${je}
      ${bn}
      attribute vec2 aWingCoord; // [signedSpanFrac, featherTone]
      attribute vec4 aBirdAnim;  // [flapPhase, flapAmp, dihedral, shadeVar]

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vFeatherTone;
      varying float vWingSpan;

      void main() {
        float signedSpan = aWingCoord.x;
        float w = abs(signedSpan);
        vFeatherTone = aWingCoord.y * (0.85 + 0.30 * aBirdAnim.w);
        vWingSpan = w;

        vec3 p = position;
        vec3 n = normal;

        if (w > 0.02) {
          float phase = aBirdAnim.x;
          float amp = aBirdAnim.y;
          float dihedral = aBirdAnim.z;

          // Dignified, slow articulated eagle wingbeat + outstretched thermal dihedral arch
          float wSafe = max(w, 0.0);
          float shoulderLift = sin(phase) * amp * pow(max(wSafe, 0.0), 1.15) * 0.145;
          float wristFlex = sin(phase - wSafe * 1.10) * amp * pow(max(wSafe, 0.0), 1.95) * 0.095;
          float glideArch = dihedral * (pow(max(wSafe, 0.0), 1.18) * 0.056 - pow(max(wSafe, 0.0), 2.7) * 0.022);

          float dy = shoulderLift + wristFlex + glideArch;
          p.y += dy;
          p.x *= (1.0 - abs(dy) * 0.28);

          float slope = (dy / max(w * 0.56, 0.04)) * sign(signedSpan);
          n = safeNorm3(vec3(n.x - slope * 0.50, n.y, n.z));
        }

        vec4 worldPos = modelMatrix * instanceMatrix * vec4(p, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = mat3(modelMatrix) * mat3(instanceMatrix) * n;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,fragmentShader:`
      ${je}
      ${bn}
      uniform float uSurge;
      uniform float uSheetFlash;
      uniform vec2 uSheetDir;
      uniform vec3 uSunDir;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vFeatherTone;
      varying float vWingSpan;

      void main() {
        vec3 n = safeNorm3(vWorldNormal);
        if (!gl_FrontFacing) n = -n;

        vec3 toCam = cameraPosition - vWorldPos;
        float camDist = length(toCam);
        vec3 viewDir = safeNorm3(toCam);

        // Rich dark-umber & golden-bronze raptor plumage (crisp contrast against snow & sky!)
        vec3 deepUmber = vec3(0.036, 0.027, 0.024);
        vec3 bronzeCoverts = vec3(0.195, 0.125, 0.072);
        vec3 darkSlate = vec3(0.072, 0.080, 0.095);
        vec3 albedo = mix(deepUmber, bronzeCoverts, smoothstep(0.18, 0.70, vFeatherTone));
        albedo = mix(albedo, darkSlate, smoothstep(0.56, 0.95, vFeatherTone) * 0.32);

        // Direct alpine sun + controlled sky/snow fill so dark umber silhouettes stay bold & legible
        float sunDiff = max(dot(n, uSunDir), 0.0);
        float skyFill = n.y * 0.5 + 0.5;
        float snowBounce = max(-n.y, 0.0);

        vec3 ambientIrr = vec3(0.16, 0.22, 0.32) * (0.36 + 0.64 * skyFill)
          + vec3(0.15, 0.17, 0.21) * snowBounce * 0.48;

        // Warm golden-bronze sunlit feather rim & subtle primary translucency
        float sunForward = pow(max(dot(-viewDir, uSunDir), 0.0), 2.4);
        float featherTrans = smoothstep(0.24, 0.94, vWingSpan) * (0.20 + 0.80 * sunForward);
        float rimSheen = pow(max(1.0 - abs(dot(n, viewDir)), 0.0), 2.3) * smoothstep(0.18, 0.95, vWingSpan);

        vec3 col = albedo * (ambientIrr + vec3(1.10, 0.95, 0.78) * sunDiff * 1.18);
        col += vec3(0.24, 0.15, 0.08) * featherTrans * 0.32;
        col += vec3(0.46, 0.33, 0.20) * rimSheen * (0.18 + 0.36 * sunDiff);

        // Matched to mountain aerial-perspective distance (> 26m) so mid-ground eagles stay crisp
        // while distant valley eagles (> 36m) soften naturally into the cerulean sky!
        float hazeDist = max(camDist - 26.0, 0.0);
        float fogAmt = 1.0 - exp(-pow(max(hazeDist * 0.015, 0.0), 1.24));
        vec3 rayDir = safeNorm3(-toCam);
        vec3 hazeCol = computeAlpineSkyColor(vec3(rayDir.x, max(rayDir.y, 0.03), rayDir.z), uSunDir, uSurge, uSheetFlash, dot(safeNorm2(rayDir.xz), uSheetDir));
        col = mix(col, hazeCol, clamp(fogAmt, 0.0, 0.65));

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),q=new Ua(P,X,_);q.frustumCulled=!1,q.renderOrder=0,n.add(q);const B=Xr(20260412),K=[new D(1.6,0,-9.8),new D(1.8,0,-17.2),new D(-8.6,0,-21.5)],H=[];for(let J=0;J<_;J++){const ce=J<8?0:J<15?1:2,ge=ce===0?J:ce===1?J-8:J-15,pe=ce===0?8:ce===1?7:5,R=K[ce],b=ge/pe*Math.PI*2+(B()-.5)*.34,k=ce===0?2.8+B()*1.8:ce===1?4.8+B()*2.8:5.2+B()*3,Q=ce===1?-1:1,N=ce===0?3.35+ge/pe*2.3+(B()-.5)*.25:ce===1?6.8+ge/pe*2.8+(B()-.5)*.4:8.3+ge/pe*2.5+(B()-.5)*.4,G=ce===0?1.25+B()*.3:ce===1?.8+B()*.22:.68+B()*.18,te=R.x+Math.cos(b)*k,O=R.z+Math.sin(b)*k,he=(ce===0?1.95:2.2)+B()*.65,Ae=-Math.sin(b)*Q*he,ee=Math.cos(b)*Q*he;H.push({pos:new D(te,N,O),vel:new D(Ae,(B()-.5)*.16,ee),thermalIdx:ce,spinSign:Q,preferredR:k,cruiseAlt:N,baseSpeed:he,scale:G,flapPhase:B()*Math.PI*2,flapAmp:.06,flapCycleOffset:B()*18,bankAngle:0,shadeVar:B()})}const se=new yt,ue=new D,de=new D,_e=new D,Re=new D(0,1,0),j=new D,le=3144,Te=new st,fe=new Float32Array(le*3),we=new Float32Array(le*4),ve=Xr(77553311);for(let J=0;J<le;J++){const ce=J<2100?0:J<2544?1:2;if(ce===0){const ge=m[Math.floor(ve()*m.length)];fe[J*3+0]=ge.x+(ve()-.5)*.55,fe[J*3+1]=ge.y+.05+ve()*.16,fe[J*3+2]=ge.z+(ve()-.5)*.55,we[J*4+0]=ve(),we[J*4+1]=.44+ve()*.54,we[J*4+2]=2.5+Math.pow(ve(),1.8)*3.6,we[J*4+3]=0+ve()*.95}else if(ce===1){const ge=(ve()-.5)*28,pe=-18+ve()*24,R=Mi(ge,pe);fe[J*3+0]=ge,fe[J*3+1]=Math.max(R,-.5)+.45+ve()*2.8,fe[J*3+2]=pe,we[J*4+0]=ve(),we[J*4+1]=.24+ve()*.3,we[J*4+2]=7.2+ve()*5.2,we[J*4+3]=1+ve()*.95}else fe[J*3+0]=(ve()-.5)*28,fe[J*3+1]=1+ve()*7.5,fe[J*3+2]=-14+ve()*28,we[J*4+0]=ve(),we[J*4+1]=.09+ve()*.14,we[J*4+2]=2.2+Math.pow(ve(),2.1)*3,we[J*4+3]=2+ve()*.95}Te.setAttribute("position",new De(fe,3)),Te.setAttribute("aMeta",new De(we,4));const qe=new Ke({uniforms:r,transparent:!0,depthWrite:!1,blending:Yt,vertexShader:`
      ${je}
      ${bn}
      attribute vec4 aMeta; // [phase, speed, baseSize, speciesPlusSeed]

      uniform float uTime;
      uniform float uWindPhase;
      uniform float uIntensity;
      uniform float uSurge;
      uniform float uViewportScale;
      uniform float uPixelRatio;
      uniform vec2 uWindDir;
      uniform vec3 uPointerWorld;
      uniform float uPointerActive;

      varying float vSpecies;
      varying float vLife;
      varying float vGustMask;
      varying float vSeed;
      varying vec2 vScreenDir;
      varying vec3 vWorldPos;

      vec3 pseudoCurl3D(vec3 p, float t) {
        float nX = snoise(p * 0.36 + vec3(0.0, t * 0.35, 4.2));
        float nY = snoise(p * 0.36 + vec3(7.3, -t * 0.28, 0.0));
        float nZ = snoise(p * 0.36 + vec3(-3.1, t * 0.32, 9.4));
        return vec3(nY - nZ, (nZ - nX) * 0.55, nX - nY);
      }

      vec3 evaluateParticlePos(float life, float species, float seed) {
        vec2 perpWind = vec2(-uWindDir.y, uWindDir.x);

        if (species < 0.5) {
          // Species 0: Horizontal snow spindrift banners streaming leeward off sharp summits!
          float throwReach = (2.8 + 2.2 * uIntensity + 5.6 * uSurge) * (0.55 + 0.78 * seed);
          float dist = pow(max(life, 0.0), 0.90) * throwReach;

          vec3 eddy = pseudoCurl3D(position * 1.2 + vec3(dist * 0.45, 0.0, seed * 6.0), uTime * 1.7);
          float crestLift = sin(min(life * 3.6, 1.0) * 3.14159265) * 0.20 - life * life * 0.58;

          vec3 p = position;
          p.xz += uWindDir * dist + perpWind * (eddy.x * life * 0.62);
          p.y += crestLift + eddy.y * life * 0.45;
          return p;
        } else if (species < 1.5) {
          // Species 1: Ridge wind-mist wisps sweeping across the alpine pass
          float span = 26.0;
          float travel = (life - 0.5) * span;
          vec3 p = position;
          p.xz += uWindDir * travel;
          p.y += sin(life * 6.2831853 + seed * 12.0) * 0.30 + snoise(vec3(p.xz * 0.16, uTime * 0.38)) * 0.38;
          return p;
        } else {
          // Species 2: Wind-carried alpine seeds & glinting ice-crystal diamond dust
          float span = 24.0;
          float travel = (life - 0.5) * span;
          vec3 baseP = position + vec3(uWindDir.x * travel, 0.0, uWindDir.y * travel);
          vec3 curl = pseudoCurl3D(baseP * 0.50 + seed * 5.0, uTime * 0.65);
          baseP += curl * (1.05 + 0.60 * uSurge);
          baseP.y += sin(uTime * 0.88 + seed * 19.0) * 0.26;
          return baseP;
        }
      }

      vec3 applyPointerDeflection(vec3 p, float species) {
        if (uPointerActive <= 0.005) return p;
        vec2 diffXZ = p.xz - uPointerWorld.xz;
        float d2 = dot(diffXZ, diffXZ);
        if (d2 < 36.0) {
          float dist = sqrt(max(d2, 1e-4));
          float influence = (1.0 - smoothstep(0.0, 6.0, dist)) * uPointerActive;
          vec2 pushDir = diffXZ / dist;
          vec2 swirlDir = vec2(-pushDir.y, pushDir.x);
          float scale = species < 0.5 ? 0.60 : 1.45;
          p.xz += (pushDir * 1.20 + swirlDir * 0.90) * influence * scale;
          p.y += influence * 0.70 * scale;
        }
        return p;
      }

      void main() {
        float species = floor(aMeta.w);
        float seed = aMeta.w - species;
        vSpecies = species;
        vSeed = seed;

        float life = fract(aMeta.x + uWindPhase * aMeta.y * (species < 0.5 ? 0.42 : 0.14));
        vLife = life;

        vec3 p = applyPointerDeflection(evaluateParticlePos(life, species, seed), species);
        vec3 pNext = applyPointerDeflection(evaluateParticlePos(min(life + 0.025, 1.0), species, seed), species);
        vWorldPos = p;

        float gustNoise = snoise(vec3(position.xz * 0.24 - uWindDir * uTime * 1.35, uTime * 0.55 + seed * 1.5)) * 0.5 + 0.5;
        vGustMask = species < 0.5
          ? smoothstep(0.20 - 0.16 * uSurge, 0.76, gustNoise)
          : 0.65 + 0.35 * gustNoise;

        vec4 mvPos = viewMatrix * modelMatrix * vec4(p, 1.0);
        vec4 clipPos = projectionMatrix * mvPos;
        vec4 clipNext = projectionMatrix * viewMatrix * modelMatrix * vec4(pNext, 1.0);

        vec2 ndcA = clipPos.xy / max(abs(clipPos.w), 1e-4);
        vec2 ndcB = clipNext.xy / max(abs(clipNext.w), 1e-4);
        vScreenDir = safeNorm2(vec2(ndcB.x - ndcA.x, -(ndcB.y - ndcA.y)));

        float env = species < 0.5
          ? smoothstep(0.0, 0.10, life) * (1.0 - smoothstep(0.45, 1.0, life))
          : sin(life * 3.14159265);

        float dispFactor = species < 0.5 ? (0.78 + life * 1.35) : 1.0;
        float rawPt = aMeta.z * dispFactor * uPixelRatio * uViewportScale * (10.5 / max(-mvPos.z, 1.5));
        float maxCap = (species > 0.5 && species < 1.5 ? 20.0 : 13.5) * uPixelRatio * uViewportScale;
        gl_PointSize = min(rawPt * (0.45 + 0.55 * env), maxCap);
        gl_Position = clipPos;
      }
    `,fragmentShader:`
      ${je}
      ${bn}
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSurge;
      uniform vec3 uSunDir;

      varying float vSpecies;
      varying float vLife;
      varying float vGustMask;
      varying float vSeed;
      varying vec2 vScreenDir;
      varying vec3 vWorldPos;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float dCirc = length(uv);
        // Strict circular zero-margin inside dCirc < 0.42 so ZERO sprite borders ever show!
        if (dCirc >= 0.425) discard;
        float radialZero = smoothstep(0.42, 0.12, dCirc);

        vec2 perp = vec2(-vScreenDir.y, vScreenDir.x);
        float along = dot(uv, vScreenDir);
        float across = dot(uv, perp);

        vec3 rayDir = safeNorm3(vWorldPos - cameraPosition);
        float forwardSun = hgPhase(dot(rayDir, uSunDir), 0.52);

        if (vSpecies < 0.5) {
          // Species 0: Backlit snow spindrift powder streaming horizontally off rocky summits
          float dAniso = sqrt(max(along * along * 0.52 + across * across * 1.45, 0.0));
          float grain = snoise(vec3(uv * 5.2, vSeed * 17.0 + uTime * 0.8)) * 0.25 + 0.75;
          float mask = radialZero * smoothstep(0.41, 0.05, dAniso) * grain;

          float env = smoothstep(0.0, 0.08, vLife) * pow(max(1.0 - vLife, 0.0), 1.30);
          float alpha = mask * env * vGustMask * (0.34 + 0.14 * uIntensity + 0.36 * uSurge);
          if (alpha < 0.006) discard;

          vec3 col = mix(vec3(0.68, 0.77, 0.89), vec3(0.94, 0.95, 0.97), clamp(0.48 + forwardSun * 0.48, 0.0, 1.0));
          gl_FragColor = vec4(col, min(alpha, 0.82));
        } else if (vSpecies < 1.5) {
          // Species 1: Soft wind-mist streaks sweeping across mountain pass (guaranteed zero corner clip!)
          float dStreak = sqrt(max(along * along * 0.85 + across * across * 3.4, 0.0));
          float wisp = fbm2Fast(vec3(along * 3.5, across * 6.0, vSeed * 12.0 + uTime * 0.35)) * 0.5 + 0.5;
          float mask = radialZero * smoothstep(0.40, 0.06, dStreak) * smoothstep(0.24, 0.76, wisp);

          float env = sin(vLife * 3.14159265);
          float alpha = mask * env * vGustMask * (0.080 + 0.035 * uIntensity + 0.13 * uSurge);
          if (alpha < 0.005) discard;

          vec3 col = mix(vec3(0.60, 0.71, 0.86), vec3(0.88, 0.90, 0.94), clamp(0.38 + forwardSun * 0.42, 0.0, 1.0));
          gl_FragColor = vec4(col, alpha);
        } else {
          // Species 2: Delicate wind-carried alpine seeds & glinting ice-crystal diamond dust
          float dSeed = sqrt(max(along * along * 0.65 + across * across * 1.15, 0.0));
          float core = exp(-dSeed * dSeed * 28.0);
          float halo = exp(-dCirc * dCirc * 11.0) * 0.26;

          float tumbleGlint = pow(max(sin(uTime * 5.0 + vSeed * 53.0) * 0.5 + 0.5, 0.0), 14.0);
          float env = sin(vLife * 3.14159265);
          float alpha = radialZero * (core + halo) * env * (0.36 + 0.40 * tumbleGlint + 0.16 * uSurge);
          if (alpha < 0.008) discard;

          vec3 driftTint = vec3(0.76, 0.84, 0.93);
          vec3 glintWhite = vec3(0.98, 0.97, 0.94);
          vec3 col = mix(driftTint, glintWhite, clamp(tumbleGlint + core * 0.4, 0.0, 1.0));
          gl_FragColor = vec4(col, min(alpha, 0.86));
        }
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `}),Je=new Vn(Te,qe);Je.frustumCulled=!1,Je.renderOrder=7,n.add(Je);let $e=null,Qe=0,z=0;const nt=new D(0,1.5,0);let be=-1.9;return{name:"air",title:"Air · Alpine Summit & Cloud Sea",subtitle:"High-Altitude Mountain Ridge, Drifting Cumulus Sea & Thermal Updrafts",description:"High above the alpine timberline, prevailing winds scour horizontal snow spindrift off jagged granite arêtes while a sunlit sea of cumulus clouds pours through glacial passes below, casting moving shadows across the slopes as soaring eagles bank on rising thermals.",stats:"3,200 Spindrift & Clouds · 20 Soaring Eagles · Alpine Cloud Sea",accent:"#7ec4ff",scene:n,defaultCamera:{position:new D(.8,5.2,18.5),target:new D(0,3.1,-6),fov:46,minDistance:4,maxDistance:34,maxPolarAngle:Math.PI*.48},particleCount:le+v,update(J,ce,ge,pe=null){let R;$e===null?(R=.016,Qe=J*(.85+.45*ce)):R=Math.min(Math.max(J-$e,0),.08),$e=J;const b=.72+.58*ce+2.65*ge;Qe+=R*b,r.uTime.value=J,r.uWindPhase.value=Qe,r.uIntensity.value=ce,r.uSurge.value=ge,r.uViewportScale.value=pe?.activeView==="all"?.52:1,r.uWindOffset.value.set(t.x*Qe*.45,t.y*Qe*.45);const k=1-Math.exp(-Math.max(R,.008)*7.5);pe&&pe.pointerActive&&pe.pointerWorld?(nt.lerp(pe.pointerWorld,k),z+=(1-z)*k):z+=(0-z)*k,r.uPointerWorld.value.copy(nt),r.uPointerActive.value=z;let Q=0;if(ge>.04){const te=Math.sin(J*8.4)*Math.sin(J*19.3+1.1),O=Math.max(.18,.58-ge*.36);if(te>O){const he=.58+.42*Math.abs(Math.sin(J*37));Q=(te-O)/(1-O)*he*Math.min(1,ge*1.45)}else Math.sin(J*8.4)<-.85&&(be=-1.57+Math.sin(J*1.7)*.85)}r.uSheetFlash.value=Q,r.uSheetDir.value.set(Math.cos(be),Math.sin(be)),i.intensity=2.2*(1-.25*ge),a.intensity=.95+.18*Q;const N=Math.max(R,.004),G=.85+.22*ce+.52*ge;for(let te=0;te<_;te++){const O=H[te],he=K[O.thermalIdx];j.set(0,0,0);const Ae=O.pos.x-he.x,ee=O.pos.z-he.z,me=Math.hypot(Ae,ee)||.001,Ce=1/me,Ie=-ee*Ce*O.spinSign,Me=Ae*Ce*O.spinSign,Ye=(O.preferredR-me)*.48,ne=(Ie*O.baseSpeed+Ae*Ce*Ye)*G+t.x*.24*ge,Se=(Me*O.baseSpeed+ee*Ce*Ye)*G+t.y*.24*ge,ae=Math.sin(J*.32+O.flapCycleOffset)*.3+(O.cruiseAlt-O.pos.y)*.24+ge*.18;j.x+=(ne-O.vel.x)*1.65,j.y+=(ae-O.vel.y)*1.45,j.z+=(Se-O.vel.z)*1.65;for(let Pt=0;Pt<_;Pt++){if(Pt===te)continue;const Ut=H[Pt],zt=O.pos.x-Ut.pos.x,A=O.pos.y-Ut.pos.y,U=O.pos.z-Ut.pos.z,Y=zt*zt+A*A+U*U;if(Y>1e-4&&Y<6.25){const Z=(6.25-Y)/Y*.62;j.x+=zt*Z,j.y+=A*Z*.55,j.z+=U*Z}}if(z>.05){const Pt=O.pos.x-nt.x,Ut=O.pos.z-nt.z,zt=Pt*Pt+Ut*Ut;if(zt<30){const A=Math.sqrt(Math.max(zt,.01)),U=(1-A/5.5)*z*3.2;j.x+=Pt/A*U,j.z+=Ut/A*U,j.y+=U*.32}}const $=Mi(O.pos.x,O.pos.z)+1.45;O.pos.y<$+1&&(j.y+=($+1-O.pos.y)*4.8);const oe=O.vel.x,re=O.vel.z;O.vel.x+=j.x*N,O.vel.y+=j.y*N,O.vel.z+=j.z*N;const ye=O.vel.length(),We=1.65*G,Ne=3.45*G;ye<We&&ye>1e-4?O.vel.multiplyScalar(We/ye):ye>Ne&&O.vel.multiplyScalar(Ne/ye),O.pos.addScaledVector(O.vel,N),O.pos.y<$&&(O.pos.y=$,O.vel.y<0&&(O.vel.y=.25));const Ee=oe*O.vel.z-re*O.vel.x,Ge=Math.min(Math.max(-Ee/Math.max(N*ye*ye,.05)*.42,-.72),.72);O.bankAngle+=(Ge-O.bankAngle)*Math.min(1,N*4.8);const rt=Math.sin(J*.72+O.flapCycleOffset)>.64||O.vel.y>.28||ge>.48,dt=rt?.76:.04;O.flapAmp+=(dt-O.flapAmp)*Math.min(1,N*3.6),O.flapPhase+=N*(rt?6.4+2.2*ge:1.8),ue.copy(O.vel).normalize(),de.crossVectors(Re,ue),de.lengthSq()<1e-5?de.set(1,0,0):de.normalize(),_e.crossVectors(ue,de).normalize();const Ue=Math.cos(O.bankAngle),ft=Math.sin(O.bankAngle),ie=de.x*Ue+_e.x*ft,He=de.y*Ue+_e.y*ft,ze=de.z*Ue+_e.z*ft,Oe=-de.x*ft+_e.x*Ue,et=-de.y*ft+_e.y*Ue,Mt=-de.z*ft+_e.z*Ue,pt=O.scale;se.set(ie*pt,Oe*pt,ue.x*pt,O.pos.x,He*pt,et*pt,ue.y*pt,O.pos.y,ze*pt,Mt*pt,ue.z*pt,O.pos.z,0,0,0,1),q.setMatrixAt(te,se),I[te*4+0]=O.flapPhase,I[te*4+1]=O.flapAmp,I[te*4+2]=1-O.flapAmp*.65,I[te*4+3]=O.shadeVar}q.instanceMatrix.needsUpdate=!0,F.needsUpdate=!0},onResize(J){r.uPixelRatio.value=J}}}const Bv={fire:{symbol:"🜂",accent:"#ff6e24",title:"Fire · Volcanic Lava Canyon",subtitle:"Cracked Pahoehoe Lava River & Smoky Dusk Wildfire",description:"An outdoor volcanic canyon at smoky twilight where incandescent magma streams beneath drifting basalt crust plates, feeding turbulent buoyant flames, billowing underlit smoke plumes, and thousands of wind-carried glowing embers.",stats:"Volcanic Dusk · Pahoehoe Lava · Buoyant Plume",defaultCamera:{position:new D(0,3.8,11.5),target:new D(0,1.8,0),fov:46,minDistance:3.2,maxDistance:28,maxPolarAngle:Math.PI*.48}},water:{symbol:"🜄",accent:"#28c6ff",title:"Water · Coastal Waterfall Cove",subtitle:"Sunlit Ocean Swells & Plunging Basalt Cliff Falls",description:"Golden coastal daylight illuminates rolling Gerstner ocean swells with Schlick Fresnel sky reflections, emerald subsurface wave-crest scattering, sun-glitter paths, and a multi-tiered cliff waterfall plunging into frothy whitewater spray.",stats:"Coastal Daylight · Gerstner Swells · Waterfall Mist",defaultCamera:{position:new D(0,4.2,13),target:new D(0,1.9,0),fov:46,minDistance:3.5,maxDistance:30,maxPolarAngle:Math.PI*.48}},earth:{symbol:"🜃",accent:"#52d681",title:"Earth · Sunlit Mountain Valley",subtitle:"Wind-Rippling Alpine Meadow & Ancient Forest Crags",description:"Warm morning sunbeams slant across layered mountain ridges into a lush granite valley where thousands of instanced grass blades ripple in travelling Perlin wind waves beneath swaying procedural trees, tumbling leaves, and golden pollen.",stats:"Morning Valley · Wind-Wave Grass · Sunlit Canopy",defaultCamera:{position:new D(0,3.6,12),target:new D(0,1.8,0),fov:46,minDistance:3.2,maxDistance:28,maxPolarAngle:Math.PI*.48}},air:{symbol:"🜁",accent:"#9ec8ff",title:"Air · High-Altitude Alpine Summit",subtitle:"Drifting Cumulus Cloud Sea, Thermal Birds & Spindrift",description:"High above jagged snow-dusted granite peaks, sunlit cumulus cloud banks drift through mountain passes while flocks of thermal-gliding birds bank on rising updrafts amidst turbulent crest spindrift and curl-noise wind currents.",stats:"Alpine Summit · Volumetric Cloud Sea · Thermal Flock",defaultCamera:{position:new D(0,4.5,13.5),target:new D(0,2,0),fov:46,minDistance:3.5,maxDistance:32,maxPolarAngle:Math.PI*.485}}},Hn=["fire","water","earth","air"],oo={high:{label:"High",maxDpr:1.15,quadMaxDpr:1,bloomScale:.55,clarity:.045},ultra:{label:"Ultra",maxDpr:1.6,quadMaxDpr:1.35,bloomScale:.72,clarity:.075}};let ci="ultra";const kv=document.getElementById("canvas-container"),vt=new Bm({antialias:!0,powerPreference:"high-performance"}),Vv=Math.min(window.devicePixelRatio||1,oo[ci].quadMaxDpr);vt.setPixelRatio(Vv);vt.setSize(window.innerWidth,window.innerHeight);vt.toneMapping=Vs;vt.toneMappingExposure=1;vt.outputColorSpace=cn;kv.appendChild(vt.domElement);const Vt=new Qt(46,window.innerWidth/window.innerHeight,.15,2e3),At=new jm(Vt,vt.domElement);At.enableDamping=!0;At.dampingFactor=.055;At.maxPolarAngle=Math.PI*.48;At.minDistance=3;At.maxDistance=28;At.enabled=!1;const Wv={fire:Sv(),water:bv(),earth:Iv(),air:Ov()};function Ec(n,e){return n?n.isVector3?n.clone():Array.isArray(n)?new D(n[0]??0,n[1]??0,n[2]??0):typeof n.x=="number"?new D(n.x,n.y??0,n.z??0):e.clone():e.clone()}const gt={};for(const n of Hn){const e=Wv[n]||{},t=Bv[n],i=e.defaultCamera||{};let a=e.scene;a||(a=new Ka,e.group&&a.add(e.group));const r={position:Ec(i.position,t.defaultCamera.position),target:Ec(i.target,t.defaultCamera.target),fov:i.fov??t.defaultCamera.fov,minDistance:i.minDistance??t.defaultCamera.minDistance,maxDistance:i.maxDistance??t.defaultCamera.maxDistance,maxPolarAngle:i.maxPolarAngle??t.defaultCamera.maxPolarAngle},o=new Qt(r.fov,window.innerWidth/window.innerHeight,.15,2e3);o.position.copy(r.position),o.lookAt(r.target);const s=Number.isFinite(e.particleCount)?e.particleCount:0;gt[n]={key:n,symbol:t.symbol,accent:e.accent||t.accent,title:e.title||t.title,subtitle:e.subtitle||t.subtitle,description:e.description||t.description,stats:e.stats||(s>0?`${s.toLocaleString("en-GB")} Particles · ${t.stats}`:t.stats),scene:a,defaultCamera:r,quadCamera:o,quadTarget:r.target.clone(),particleCount:s,update:typeof e.update=="function"?e.update.bind(e):()=>{},onResize:typeof e.onResize=="function"?e.onResize.bind(e):()=>{}}}const Ou=Hn.reduce((n,e)=>n+gt[e].particleCount,0);Vt.position.copy(gt.fire.defaultCamera.position);At.target.copy(gt.fire.defaultCamera.target);At.update();const ui=xv(),Gv={name:"NaturalGradeShader",uniforms:{tDiffuse:{value:null},uClarity:{value:oo[ci].clarity},uVignette:{value:.045}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float uClarity;
    uniform float uVignette;
    varying vec2 vUv;

    float interleavedGradientNoise(vec2 p) {
      return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
    }

    void main() {
      vec4 baseSample = texture2D(tDiffuse, vUv);
      vec3 col = baseSample.rgb;

      // Single-tap midtone-preserving contrast & vibrance polish (zero midtone darkening)
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      float midMask = smoothstep(0.06, 0.28, luma) * (1.0 - smoothstep(0.74, 0.98, luma));
      vec3 sCurve = col * col * (3.0 - 2.0 * col);
      col = mix(col, sCurve, uClarity * midMask);

      // Whisper-light outer-corner framing that preserves 100% of sky & midtone luminance
      vec2 vigUv = (vUv - 0.5) * vec2(1.06, 1.0);
      float cornerFade = smoothstep(0.56, 0.94, length(vigUv));
      col *= 1.0 - cornerFade * uVignette * (1.0 - luma * 0.55);

      // Sub-LSB dither to prevent 8-bit sky gradient banding
      float dither = (interleavedGradientNoise(gl_FragCoord.xy) - 0.5) / 255.0;
      col = clamp(col + dither, 0.0, 1.0);

      gl_FragColor = vec4(col, baseSample.a);
    }
  `},Hv=new vn(window.innerWidth,window.innerHeight,{type:Pn,samples:4}),Di=new hv(vt,Hv),Os=new fv(gt.fire.scene,Vt);Di.addPass(Os);const Zr=new ma(new Le(window.innerWidth,window.innerHeight),.28,.35,1.05);Di.addPass(Zr);const Xv=new vv;Di.addPass(Xv);const Bu=new Fu(Gv);Di.addPass(Bu);const Dr=new qm,Lr=new Le,Cc=new On(new D(0,1,0),-.5),Ki=new D,jr=new D(0,.5,0),qo=new D(0,.5,0);let Oa=0,Ba=0,so=!1,si=!1,li=null;function ol(){if(!so){si=!1,li=null;return}const n=Math.max(1,window.innerWidth),e=Math.max(1,window.innerHeight);if(Xt==="all"){const t=n*.5,i=e*.5,a=Oa>=t,r=Ba>=i;let o="fire";!r&&a?o="water":r&&!a?o="earth":r&&a&&(o="air");const s=a?(Oa-t)/Math.max(1,n-t):Oa/Math.max(1,t),l=r?(Ba-i)/Math.max(1,e-i):Ba/Math.max(1,i);Lr.set(s*2-1,-(l*2-1));const c=gt[o].quadCamera;c.updateMatrixWorld(),Dr.setFromCamera(Lr,c),Dr.ray.intersectPlane(Cc,Ki)&&Ki.distanceToSquared(c.position)<6400?(jr.copy(Ki),si=!0,li=o):(si=!1,li=null)}else Lr.set(Oa/n*2-1,-(Ba/e*2-1)),Vt.updateMatrixWorld(),Dr.setFromCamera(Lr,Vt),Dr.ray.intersectPlane(Cc,Ki)&&Ki.distanceToSquared(Vt.position)<6400?(jr.copy(Ki),si=!0,li=Xt):(si=!1,li=null)}function sl(n){Oa=n.clientX,Ba=n.clientY,so=!0,ol()}function ll(){so=!1,si=!1,li=null}let Xt="all",Ya=!1;const na=new D,di=new D;let ia=1,aa=!1,ka=!1,$r=!1,Bs=0;const Pc=4,Va=[{view:"all",duration:6,surgeAt:null},{view:"fire",duration:6.5,surgeAt:null},{view:"water",duration:6.5,surgeAt:null},{view:"earth",duration:6.5,surgeAt:null},{view:"air",duration:6.5,surgeAt:null},{view:"all",duration:6.5,surgeAt:1.25}];let jn=!1,wi=0,ri=0,Wa=!1;const Ci=document.getElementById("quad-grid"),qv=document.querySelectorAll(".quad-cell[data-realm]"),ku=document.querySelectorAll("[data-view]"),Nr=document.getElementById("brand-hint"),La=document.getElementById("element-card"),Rc=document.getElementById("card-symbol"),Dc=document.getElementById("card-title"),Lc=document.getElementById("card-subtitle"),Nc=document.getElementById("card-desc"),Fc=document.getElementById("card-stats"),Ic=document.getElementById("card-back"),fi=document.getElementById("btn-tour"),Kr=document.getElementById("tour-label"),Ga=document.getElementById("btn-sound"),Uc=document.getElementById("sound-label"),Fr=document.getElementById("btn-drift"),va=document.getElementById("btn-surge"),zc=document.getElementById("btn-quality"),Oc=document.getElementById("quality-label"),Bc=document.getElementById("btn-hide-hud"),kc=document.getElementById("btn-show-hud"),Vc=document.getElementById("intensity-slider"),Wc=document.getElementById("intensity-val"),Gc=document.getElementById("particle-count"),Hc=document.getElementById("fps-counter");Gc&&(Gc.textContent=Ou.toLocaleString("en-GB"));for(const n of Hn){const e=gt[n],t=document.getElementById(`quad-title-${n}`),i=document.getElementById(`quad-sub-${n}`),a=document.querySelector(`.quad-cell[data-realm="${n}"]`),r=document.querySelector(`.nav-btn[data-view="${n}"]`);t&&(t.textContent=e.title),i&&(i.textContent=e.subtitle),a&&a.style.setProperty("--q-accent",e.accent),r&&r.style.setProperty("--nav-accent",e.accent)}vt.domElement.addEventListener("pointermove",sl);vt.domElement.addEventListener("pointerdown",sl);vt.domElement.addEventListener("pointerleave",ll);Ci&&(Ci.addEventListener("pointermove",sl),Ci.addEventListener("pointerleave",ll));window.addEventListener("blur",ll);At.addEventListener("start",()=>{Ya=!1,jn&&cl()});function cl(){jn=!1,ri=0,Wa=!1,fi&&(fi.classList.remove("active"),fi.setAttribute("aria-pressed","false")),Kr&&(Kr.textContent="Guided Tour"),document.body.classList.remove("tour-active"),document.documentElement.style.setProperty("--tour-progress","0")}function ul(){return jn?(cl(),!1):(jn=!0,wi=0,ri=0,Wa=!1,fi&&(fi.classList.add("active"),fi.setAttribute("aria-pressed","true")),Kr&&(Kr.textContent="Touring…"),document.body.classList.add("tour-active"),document.documentElement.style.setProperty("--tour-progress","0"),mn(Va[0].view,{fromTour:!0}),!0)}function mn(n,{fromTour:e=!1}={}){const t=n==="sanctum"?"all":n;if(t!=="all"&&!gt[t])return;!e&&jn&&cl();const i=Xt;if(Xt=t,ui.setFocus(t),ku.forEach(a=>{a.classList.toggle("active",a.dataset.view===t)}),t==="all")At.enabled=!1,At.autoRotate=!1,Ya=!1,Ci&&Ci.classList.remove("hidden"),La&&La.classList.add("hidden"),Nr&&(Nr.textContent="Click any realm or press 1–4 · 0 / Esc for All Realms · T (Tour) · M (Audio) · H (Hide UI)");else{const a=gt[t],r=a.defaultCamera;if(Os.scene=a.scene,Os.camera=Vt,Vt.fov=r.fov,Vt.aspect=window.innerWidth/window.innerHeight,Vt.updateProjectionMatrix(),At.minDistance=r.minDistance,At.maxDistance=r.maxDistance,At.maxPolarAngle=r.maxPolarAngle,At.enabled=!0,na.copy(r.position),di.copy(r.target),i!==t){const o=na.clone().sub(di);Vt.position.copy(di).addScaledVector(o,1.06),Vt.position.y+=.18,At.target.copy(di),At.update()}Ya=!0,Ci&&Ci.classList.add("hidden"),La&&(La.style.setProperty("--card-accent",a.accent),Rc&&(Rc.textContent=a.symbol),Dc&&(Dc.textContent=a.title),Lc&&(Lc.textContent=a.subtitle),Nc&&(Nc.textContent=a.description),Fc&&(Fc.textContent=a.stats),La.classList.remove("hidden")),Nr&&(Nr.textContent="Move cursor across landscape · Drag to orbit · Scroll to zoom · 0 / Esc for All Realms")}i==="all"!=(t==="all")&&uo(),ol()}qv.forEach(n=>{n.addEventListener("click",()=>{mn(n.dataset.realm)})});ku.forEach(n=>{n.addEventListener("click",()=>{mn(n.dataset.view)})});Ic&&Ic.addEventListener("click",()=>mn("all"));function lo(){$r=!0,Bs=0,va&&va.classList.add("surging"),ui.triggerSurge()}va&&va.addEventListener("click",lo);function Xc(n){Ga&&(Ga.classList.toggle("active",n),Ga.setAttribute("aria-pressed",String(n))),Uc&&(Uc.textContent=n?"Audio On":"Nature Audio")}function dl(){const n=ui.toggle();return n&&typeof n.then=="function"?n.then(e=>Xc(!!(e??ui.enabled))):Xc(!!(n??ui.enabled)),!!ui.enabled}Ga&&Ga.addEventListener("click",dl);fi&&fi.addEventListener("click",ul);Fr&&Fr.addEventListener("click",()=>{aa=!aa,Fr.classList.toggle("active",aa),Fr.setAttribute("aria-pressed",String(aa))});function co(){return ka=!ka,document.body.classList.toggle("hud-hidden",ka),ka}Bc&&Bc.addEventListener("click",co);kc&&kc.addEventListener("click",co);let qc=0,Yc=0,Zc=0,jc=0;function uo(){const n=Math.max(1,window.innerWidth),e=Math.max(1,window.innerHeight),t=oo[ci],i=window.devicePixelRatio||1,a=Math.min(i,t.maxDpr),r=Math.min(i,t.quadMaxDpr),o=Xt==="all"?r:a;Vt.aspect=n/e,Vt.updateProjectionMatrix();const s=Math.max(1,Math.floor(n*.5)),l=Math.max(1,n-s),c=Math.max(1,Math.floor(e*.5)),f=Math.max(1,e-c);if(gt.fire.quadCamera.aspect=s/f,gt.fire.quadCamera.updateProjectionMatrix(),gt.water.quadCamera.aspect=l/f,gt.water.quadCamera.updateProjectionMatrix(),gt.earth.quadCamera.aspect=s/c,gt.earth.quadCamera.updateProjectionMatrix(),gt.air.quadCamera.aspect=l/c,gt.air.quadCamera.updateProjectionMatrix(),vt.setPixelRatio(o),vt.setSize(n,e),n!==qc||e!==Yc||a!==Zc||t.bloomScale!==jc){qc=n,Yc=e,Zc=a,jc=t.bloomScale,Di.setPixelRatio(a),Di.setSize(n,e);const d=Math.max(2,Math.round(n*a)),h=Math.max(2,Math.round(e*a)),p=Math.max(2,Math.round(d*t.bloomScale)),g=Math.max(2,Math.round(h*t.bloomScale));Zr.resolution.set(p,g),Zr.setSize(p,g)}Bu.uniforms.uClarity.value=t.clarity;for(const d of Hn)gt[d].onResize(o)}function hl(){return ci=ci==="ultra"?"high":"ultra",Oc&&(Oc.textContent=oo[ci].label),uo(),ci}zc&&zc.addEventListener("click",hl);Vc&&Vc.addEventListener("input",n=>{ia=parseFloat(n.target.value),Wc&&(Wc.textContent=`${ia.toFixed(1)}×`)});window.addEventListener("keydown",n=>{if(n.metaKey||n.ctrlKey||n.altKey)return;const e=document.activeElement?.tagName;n.key==="0"||n.key==="Escape"?mn("all"):n.key==="1"?mn("fire"):n.key==="2"?mn("water"):n.key==="3"?mn("earth"):n.key==="4"?mn("air"):n.code==="Space"&&e!=="BUTTON"&&e!=="INPUT"?(n.preventDefault(),lo()):n.key==="m"||n.key==="M"?dl():n.key==="t"||n.key==="T"?ul():n.key==="h"||n.key==="H"?co():(n.key==="q"||n.key==="Q")&&hl()});window.addEventListener("resize",uo);uo();const $c=new Du,Na=new D;let Yo=0,Ir=0;function Yv(n){if(!$r)return 0;if(n>=Pc)return $r=!1,va&&va.classList.remove("surging"),0;const e=Math.min(1,n/.48),t=1-Math.pow(Math.max(0,(n-.48)/(Pc-.48)),1.6);return e*e*(3-2*e)*t}function Zv(n){const e=aa||jn?1:.25;for(let t=0;t<Hn.length;t++){const i=Hn[t],a=gt[i],r=a.defaultCamera.position,o=a.defaultCamera.target,s=r.x-o.x,l=r.z-o.z,c=Math.sin(n*.24+t*1.35)*.14*e,f=Math.cos(c),d=Math.sin(c);a.quadCamera.position.set(o.x+s*f-l*d,r.y+Math.sin(n*.34+t*.9)*.18*e,o.z+s*d+l*f),a.quadCamera.lookAt(o)}}function Vu(){requestAnimationFrame(Vu);const n=Math.min($c.getDelta(),.05),e=$c.elapsedTime;if(Yo++,Ir+=n,Ir>=.5){const o=Math.round(Yo/Ir);Hc&&(Hc.textContent=`${o} FPS`),Yo=0,Ir=0}let t=0;if($r&&(Bs+=n,t=Yv(Bs)),Zr.strength=.28+t*.14,jn){ri+=n;const o=Va[wi];o.surgeAt!==null&&!Wa&&ri>=o.surgeAt&&(Wa=!0,lo());const s=Math.min(1,ri/o.duration);document.documentElement.style.setProperty("--tour-progress",s.toFixed(3)),ri>=o.duration&&(wi=wi>=Va.length-1?1:wi+1,ri=0,Wa=!1,mn(Va[wi].view,{fromTour:!0}))}if(Xt==="all")Zv(e);else{const o=gt[Xt];if(jn){const s=Va[wi],l=Math.min(1,ri/s.duration),c=o.defaultCamera.position,f=o.defaultCamera.target;Na.copy(c).sub(f);const d=(l-.5)*.34,h=Math.cos(d),p=Math.sin(d),g=Na.x*h-Na.z*p,x=Na.x*p+Na.z*h;na.set(f.x+g,c.y+Math.sin(l*Math.PI)*.22,f.z+x),di.copy(f);const m=1-Math.exp(-n*3.2);Vt.position.lerp(na,m),At.target.lerp(di,m),At.autoRotate=!1}else if(Ya){const s=1-Math.exp(-n*4.2);Vt.position.lerp(na,s),At.target.lerp(di,s),Vt.position.distanceTo(na)<.04&&At.target.distanceTo(di)<.04&&(Ya=!1),At.autoRotate=!1}else aa?(At.autoRotate=!0,At.autoRotateSpeed=.85):At.autoRotate=!1;At.update()}so&&ol();let i=0;if(Xt==="all")for(const o of Hn){const s=si&&li===o,l={pointerWorld:s?jr:qo,pointerActive:s,activeView:Xt};gt[o].update(e,ia,t,l)}else{const o=si&&li===Xt;gt[Xt].update(e,ia,t,{pointerWorld:o?jr:qo,pointerActive:o,activeView:Xt}),i=Math.floor(e*60)%Hn.length;const s=Hn[i];s!==Xt&&gt[s].update(e,ia,t,{pointerWorld:qo,pointerActive:!1,activeView:Xt})}ui.update(e,ia,t);const a=Math.max(1,window.innerWidth),r=Math.max(1,window.innerHeight);if(Xt==="all"){const o=Math.max(1,Math.floor(a*.5)),s=Math.max(1,a-o),l=Math.max(1,Math.floor(r*.5)),c=Math.max(1,r-l);vt.setRenderTarget(null),vt.setScissorTest(!0),vt.setViewport(0,l,o,c),vt.setScissor(0,l,o,c),vt.render(gt.fire.scene,gt.fire.quadCamera),vt.setViewport(o,l,s,c),vt.setScissor(o,l,s,c),vt.render(gt.water.scene,gt.water.quadCamera),vt.setViewport(0,0,o,l),vt.setScissor(0,0,o,l),vt.render(gt.earth.scene,gt.earth.quadCamera),vt.setViewport(o,0,s,l),vt.setScissor(o,0,s,l),vt.render(gt.air.scene,gt.air.quadCamera),vt.setScissorTest(!1),vt.setViewport(0,0,a,r),vt.setScissor(0,0,a,r)}else vt.setScissorTest(!1),Di.render(n)}window.__FOUR_ELEMENTS_STATE__={get activeView(){return Xt},get totalParticles(){return Ou},get guidedTour(){return jn},get soundEnabled(){return!!ui.enabled},get hudHidden(){return ka},get qualityTier(){return ci},setView:n=>mn(n),triggerSurge:lo,toggleTour:ul,toggleHud:co,toggleSound:dl,toggleQuality:hl};mn("all");Vu();
