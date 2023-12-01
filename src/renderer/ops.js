//Matrix operations
export function translate(t,n){for(var a=0;a<3;a++)t[a]=t[a]+n[a]*t[3],t[4+a]=t[4+a]+n[a]*t[7],t[8+a]=t[8+a]+n[a]*t[11],t[12+a]=t[12+a]+n[a]*t[15]}

export function scale(t,n){t[0]*=n[0],t[5]*=n[1],t[10]*=n[2]}

export function rotateX(t,n){var a=Math.cos(n),r=Math.sin(n),o=t[1],e=t[5],i=t[9];t[1]=t[1]*a-t[2]*r,t[5]=t[5]*a-t[6]*r,t[9]=t[9]*a-t[10]*r,t[2]=t[2]*a+o*r,t[6]=t[6]*a+e*r,t[10]=t[10]*a+i*r}

export function rotateY(t,n){var a=Math.cos(n),r=Math.sin(n),o=t[0],e=t[4],i=t[8];t[0]=a*t[0]+r*t[2],t[4]=a*t[4]+r*t[6],t[8]=a*t[8]+r*t[10],t[2]=a*t[2]-r*o,t[6]=a*t[6]-r*e,t[10]=a*t[10]-r*i}

// export function rotateZ(t,n){
//   var a=Math.cos(n),r=Math.sin(n),o=t[0],e=t[4],i=t[8];
//   t[0]=a*t[0]+r*t[1],t[4]=a*t[4]+r*t[5],t[8]=a*t[8]+r*t[9],t[1]=a*t[1]-r*o,t[5]=a*t[5]-r*e,t[9]=a*t[9]-r*i}

export function rotateZ(t,n){
    var a=Math.cos(n),r=Math.sin(n),o=t[0],e=t[4],i=t[8],u=t[12];
    t[0]=a*t[0]+r*t[1],t[4]=a*t[4]+r*t[5],t[8]=a*t[8]+r*t[9],t[12]=a*t[12]+r*t[13]
    t[1]=a*t[1]-r*o,t[5]=a*t[5]-r*e,t[9]=a*t[9]-r*i,t[13]=a*t[13]-r*u}

export function rightRotateZ(t,n){
    var a=Math.cos(n),r=-Math.sin(n),o=t[0],e=t[1],i=t[2],u=t[3];
    t[0]=a*t[0]+r*t[4],t[1]=a*t[1]+r*t[5],t[2]=a*t[2]+r*t[6],t[3]=a*t[3]+r*t[7]
    t[4]=a*t[4]-r*o,t[5]=a*t[5]-r*e,t[6]=a*t[6]-r*i,t[7]=a*t[7]-r*u}

export function invert(t,n){let a=n[0],r=n[1],o=n[2],e=n[3],i=n[4],u=n[5],c=n[6],s=n[7],f=n[8],l=n[9],h=n[10],M=n[11],v=n[12],p=n[13],m=n[14],y=n[15],X=a*u-r*i,Y=a*c-o*i,Z=a*s-e*i,b=r*c-o*u,d=r*s-e*u,g=o*s-e*c,j=f*p-l*v,k=f*m-h*v,q=f*y-M*v,w=l*m-h*p,x=l*y-M*p,z=h*y-M*m,A=X*z-Y*x+Z*w+b*q-d*k+g*j;return A?(A=1/A,t[0]=(u*z-c*x+s*w)*A,t[1]=(o*x-r*z-e*w)*A,t[2]=(p*g-m*d+y*b)*A,t[3]=(h*d-l*g-M*b)*A,t[4]=(c*q-i*z-s*k)*A,t[5]=(a*z-o*q+e*k)*A,t[6]=(m*Z-v*g-y*Y)*A,t[7]=(f*g-h*Z+M*Y)*A,t[8]=(i*x-u*q+s*j)*A,t[9]=(r*q-a*x-e*j)*A,t[10]=(v*d-p*Z+y*X)*A,t[11]=(l*Z-f*d-M*X)*A,t[12]=(u*k-i*w-c*j)*A,t[13]=(a*w-r*k+o*j)*A,t[14]=(p*Y-v*b-m*X)*A,t[15]=(f*b-l*Y+h*X)*A,t):null}

export function transpose(t,n){if(t===n){let a=n[1],r=n[2],o=n[3],e=n[6],i=n[7],u=n[11];t[1]=n[4],t[2]=n[8],t[3]=n[12],t[4]=a,t[6]=n[9],t[7]=n[13],t[8]=r,t[9]=e,t[11]=n[14],t[12]=o,t[13]=i,t[14]=u}else t[0]=n[0],t[1]=n[4],t[2]=n[8],t[3]=n[12],t[4]=n[1],t[5]=n[5],t[6]=n[9],t[7]=n[13],t[8]=n[2],t[9]=n[6],t[10]=n[10],t[11]=n[14],t[12]=n[3],t[13]=n[7],t[14]=n[11],t[15]=n[15];return t}

export function multiply(t,n,a){let r=n[0],o=n[1],e=n[2],i=n[3],u=n[4],c=n[5],s=n[6],f=n[7],l=n[8],h=n[9],M=n[10],v=n[11],p=n[12],m=n[13],y=n[14],X=n[15],Y=a[0],Z=a[1],b=a[2],d=a[3];return t[0]=Y*r+Z*u+b*l+d*p,t[1]=Y*o+Z*c+b*h+d*m,t[2]=Y*e+Z*s+b*M+d*y,t[3]=Y*i+Z*f+b*v+d*X,Y=a[4],Z=a[5],b=a[6],d=a[7],t[4]=Y*r+Z*u+b*l+d*p,t[5]=Y*o+Z*c+b*h+d*m,t[6]=Y*e+Z*s+b*M+d*y,t[7]=Y*i+Z*f+b*v+d*X,Y=a[8],Z=a[9],b=a[10],d=a[11],t[8]=Y*r+Z*u+b*l+d*p,t[9]=Y*o+Z*c+b*h+d*m,t[10]=Y*e+Z*s+b*M+d*y,t[11]=Y*i+Z*f+b*v+d*X,Y=a[12],Z=a[13],b=a[14],d=a[15],t[12]=Y*r+Z*u+b*l+d*p,t[13]=Y*o+Z*c+b*h+d*m,t[14]=Y*e+Z*s+b*M+d*y,t[15]=Y*i+Z*f+b*v+d*X,t}

//Matrix multiplied by vector
export function mmv(e, M, v){
    e[0] = M[0] * v[0] + M[4] * v[1] + M[8] * v[2] + M[12] * v[3];
    e[1] = M[1] * v[0] + M[5] * v[1] + M[9] * v[2] + M[13] * v[3];
    e[2] = M[2] * v[0] + M[6] * v[1] + M[10] * v[2] + M[14] * v[3];
    e[3] = M[3] * v[0] + M[7] * v[1] + M[11] * v[2] + M[15] * v[3];
}
