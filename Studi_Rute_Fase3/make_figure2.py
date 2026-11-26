import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Rectangle
from matplotlib.lines import Line2D
from matplotlib.patches import Patch

BASE=Path(__file__).resolve().parent
SRC=str(BASE.parent/'03_Data_dan_Kode'/'Studi_Rute_Fase2'/'phase2_test'/'maps.jsonl')
SEED='2024-01-13'
OUT=str(BASE/'Gambar_2_Graf_U0013_Awal_dan_Optimasi.png')
import sys
if len(sys.argv)>1: SRC=sys.argv[1]
if len(sys.argv)>2: OUT=sys.argv[2]

maps={}
for l in open(SRC,encoding='utf-8'):
    r=json.loads(l)
    if r.get('seed')==SEED:
        maps[r['method']]=r['map']
assert {'original','local_swap_repair'} <= set(maps), 'Data U0013 tidak lengkap'
original, local = maps['original'], maps['local_swap_repair']
assert len(original) == len(local) == 7
assert [[n['id'] for n in layer] for layer in original] == [[n['id'] for n in layer] for layer in local]
assert {n['id']:n['next'] for layer in original for n in layer} == {n['id']:n['next'] for layer in local for n in layer}
assert all(sorted(n['type'] for n in a) == sorted(n['type'] for n in b) for a,b in zip(original,local))
REW={'peti','toko'}
# (isi, teks, singkatan)  palet Okabe-Ito yang disesuaikan
STY={
 'tempur':('#E5E7EB','#1F2937','Tp'),
 'elit':('#C0392B','#FFFFFF','El'),
 'tantangan':('#7A5FA8','#FFFFFF','Tn'),
 'peti':('#E69F00','#1F2937','Pt'),
 'toko':('#009E73','#FFFFFF','Tk'),
 'misteri':('#56B4E9','#1F2937','Ms'),
 'api':('#F6C9A8','#1F2937','Ap'),
 'bos':('#1F2937','#FFFFFF','Bs'),
}
NAMA={'tempur':'Tempur','elit':'Elite','tantangan':'Tantangan','peti':'Peti','toko':'Toko','misteri':'Misteri','api':'Api','bos':'Bos'}
DY=0.165; R=0.056
C_L='#1D4ED8'; C_R='#111827'

def positions(m):
    pos={}
    for li,L in enumerate(m):
        n=len(L)
        xs=[0.5] if n==1 else [(i+0.5)/n for i in range(n)]
        if li==0: xs=[0.25,0.75]
        for n_,x in zip(L,xs): pos[n_['id']]=(x,li*DY)
    return pos

def best_path(m,start):
    nodes={n['id']:n for L in m for n in L}
    best=[-1,None]
    def dfs(i,p,c):
        n=nodes[i]; c+= n['type'] in REW; p=p+[i]
        if not n['next']:
            if c>best[0]: best[0],best[1]=c,p
            return
        for j in n['next']: dfs(j,p,c)
    dfs(start,[],0)
    return best

def draw(ax,m,ref,title,ok):
    pos=positions(m); nodes={n['id']:n for L in m for n in L}
    refn={n['id']:n['type'] for L in ref for n in L}
    # pita lapisan yang dapat ditata ulang
    ax.add_patch(FancyBboxPatch((-0.115,DY*1-0.095),1.17,DY*3+0.19,boxstyle='round,pad=0,rounding_size=0.04',
                                fc='#EEF4FB',ec='none',zorder=0))
    # sisi graf
    for n in nodes.values():
        for j in n['next']:
            (x1,y1),(x2,y2)=pos[n['id']],pos[j]
            ax.plot([x1,x2],[y1,y2],color='#AEB8C6',lw=1.0,zorder=1,solid_capstyle='round')
    # jalur terbaik
    res=[]
    for k,s in enumerate(m[0]):
        c,p=best_path(m,s['id']); res.append(c)
        off=-0.011 if k==0 else 0.011
        xs=[pos[i][0]+off for i in p]; ys=[pos[i][1] for i in p]
        if k==0: ax.plot(xs,ys,color=C_L,lw=3.0,zorder=2,solid_capstyle='round',alpha=0.95)
        else: ax.plot(xs,ys,color=C_R,lw=2.6,zorder=2,ls=(0,(3.2,2.0)),solid_capstyle='butt')
    # node
    for nid,(x,y) in pos.items():
        t=nodes[nid]['type']; f,tc,ab=STY[t]
        if ok and refn[nid]!=t:   # jenis ruang berubah
            ax.add_patch(Circle((x,y),R+0.020,fc='none',ec='#111827',lw=1.1,ls=(0,(2,1.6)),zorder=3))
        rew=t in REW
        ax.add_patch(Circle((x,y),R,fc=f,ec='#111827' if rew else '#6B7280',lw=1.9 if rew else 0.8,zorder=4))
        ax.text(x,y-0.002,ab,ha='center',va='center',fontsize=7.4,color=tc,fontweight='bold',zorder=5)
    # label lapisan
    for li in range(len(m)):
        ax.text(-0.095,li*DY,f'L{li}',ha='left',va='center',fontsize=6.4,color='#6B7280',zorder=5)
    ax.text(pos['0-0'][0],-0.115,'Titik awal kiri',ha='center',va='top',fontsize=7,color=C_L,fontweight='bold')
    ax.text(pos['0-1'][0],-0.115,'Titik awal kanan',ha='center',va='top',fontsize=7,color=C_R,fontweight='bold')
    ax.set_xlim(-0.14,1.08); ax.set_ylim(-0.50,DY*6+0.11); ax.set_aspect('equal'); ax.axis('off')
    ax.set_title(title,fontsize=9.2,fontweight='bold',pad=3,loc='left',x=0.0)
    # kotak ringkasan
    fc='#FDECEA' if not ok else '#E7F6EF'; ec='#C0392B' if not ok else '#009E73'
    ax.add_patch(FancyBboxPatch((0.0,-0.435),0.98,0.20,boxstyle='round,pad=0,rounding_size=0.03',fc=fc,ec=ec,lw=0.9,zorder=2))
    ax.text(0.49,-0.30,f'Peti/Toko terbanyak: kiri {res[0]}, kanan {res[1]}',ha='center',va='center',fontsize=7.4)
    ax.text(0.49,-0.37,f'Minimum {min(res)}  ·  Selisih {abs(res[0]-res[1])}',ha='center',va='center',fontsize=7.8,fontweight='bold')
    return res

fig,axes=plt.subplots(1,2,figsize=(7.2,5.5),dpi=300)
awal=draw(axes[0],maps['original'],maps['original'],'(a) Peta awal',False)
lokal=draw(axes[1],maps['local_swap_repair'],maps['original'],'(b) Hasil pencarian lokal',True)
assert awal == [1,4] and lokal == [3,3]

types=['tempur','elit','peti','toko','misteri','api','bos']
h=[Line2D([0],[0],marker='o',ls='',markersize=8.5,markerfacecolor=STY[k][0],
          markeredgecolor='#111827' if k in REW else '#6B7280',markeredgewidth=1.6 if k in REW else 0.6,
          label=f'{STY[k][2]}  {NAMA[k]}') for k in types]
h2=[Line2D([0],[0],color=C_L,lw=3.0,label='Jalur terbaik kiri (contoh)'),
    Line2D([0],[0],color=C_R,lw=2.6,ls=(0,(3.2,2.0)),label='Jalur terbaik kanan (contoh)'),
    Line2D([0],[0],marker='o',ls='',markersize=10,markerfacecolor='none',markeredgecolor='#111827',markeredgewidth=1.1,
           label='Ruang berubah'),
    Patch(fc='#EEF4FB',ec='#C7D6E8',label='Lapisan ditata (L1–L4)')]
l1=fig.legend(handles=h,loc='lower center',bbox_to_anchor=(0.5,0.055),ncol=7,fontsize=7.2,frameon=False,columnspacing=1.0,handletextpad=0.3)
l2=fig.legend(handles=h2,loc='lower center',bbox_to_anchor=(0.5,-0.005),ncol=4,fontsize=7.0,frameon=False,columnspacing=1.0,handletextpad=0.5)
fig.subplots_adjust(left=0.01,right=0.99,top=0.955,bottom=0.12,wspace=0.03)
fig.savefig(OUT,dpi=300,facecolor='white',bbox_inches='tight',pad_inches=0.06)
print('ok',OUT)
