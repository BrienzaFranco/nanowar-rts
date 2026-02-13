// NANOWAR RTS v4.0 - Sistema de Defensa
const PLAYER_COLORS = ['#4CAF50','#f44336','#2196F3','#FF9800','#9C27B0','#00BCD4','#FFEB3B','#E91E63'];

class Entity {
    constructor(x,y,ownerId,id) {
        this.id=id; this.x=x; this.y=y; this.owner=ownerId;
        this.radius=5; this.vx=0; this.vy=0;
        this.maxSpeed=120; this.acceleration=250; this.friction=0.95;
        this.hp=1; this.damage=1; this.selected=false;
        this.dead=false; this.dying=false; this.deathTime=0;
        this.waypoints=[]; this.currentTarget=null;
    }
    setTarget(x,y){this.waypoints=[{x,y}];this.currentTarget=null;}
    stop(){this.waypoints=[];this.currentTarget=null;this.vx*=0.3;this.vy*=0.3;}
    update(dt,allEntities,nodes){
        if(this.dead)return;
        if(this.dying){this.deathTime+=dt;if(this.deathTime>=0.4)this.dead=true;return;}
        if(!this.currentTarget&&this.waypoints.length>0)this.currentTarget=this.waypoints.shift();
        if(this.currentTarget){
            const dx=this.currentTarget.x-this.x,dy=this.currentTarget.y-this.y;
            const dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<15)this.currentTarget=this.waypoints.length>0?this.waypoints.shift():null;
            else{this.vx+=(dx/dist)*this.acceleration*dt;this.vy+=(dy/dist)*this.acceleration*dt;}
        }
        this.vx+=(Math.random()-0.5)*15*dt;this.vy+=(Math.random()-0.5)*15*dt;
        this.vx*=this.friction;this.vy*=this.friction;
        const speed=Math.sqrt(this.vx*this.vx+this.vy*this.vy);
        if(speed>this.maxSpeed){this.vx=(this.vx/speed)*this.maxSpeed;this.vy=(this.vy/speed)*this.maxSpeed;}
        if(speed<3&&speed>0){this.vx=(this.vx/speed)*3;this.vy=(this.vy/speed)*3;}
        this.x+=this.vx*dt;this.y+=this.vy*dt;
        this.checkNodeProximity(nodes);
    }
    checkNodeProximity(nodes){
        for(let node of nodes){
            const dx=node.x-this.x,dy=node.y-this.y;
            const dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<node.radius+this.radius){
                if(node.owner===this.owner){
                    const nx=dx/dist,ny=dy/dist;
                    this.x-=nx*((node.radius+this.radius)-dist+2);
                    this.y-=ny*((node.radius+this.radius)-dist+2);
                    this.vx-=nx*80;this.vy-=ny*80;
                }else if(!this.dying){
                    node.receiveAttack(this.owner,1);
                    this.die('attack');
                }
                return;
            }
        }
    }
    die(type){this.dying=true;this.deathType=type;this.deathTime=0;}
    draw(ctx,camera){
        if(this.dead)return;
        const sx=(this.x-camera.x)*camera.zoom,sy=(this.y-camera.y)*camera.zoom,sr=this.radius*camera.zoom;
        if(this.dying){const p=this.deathTime/0.4,alpha=1-p;ctx.beginPath();ctx.arc(sx,sy,sr*(1+p*2),0,Math.PI*2);ctx.fillStyle=`rgba(255,100,100,${alpha})`;ctx.fill();return;}
        ctx.beginPath();ctx.arc(sx+1,sy+1,sr,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fill();
        ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fillStyle=PLAYER_COLORS[this.owner%PLAYER_COLORS.length];ctx.fill();
        if(this.selected){ctx.beginPath();ctx.arc(sx,sy,sr+3*camera.zoom,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=1.5*camera.zoom;ctx.stroke();}
    }
    isPointInside(x,y,camera){const sx=(this.x-camera.x)*camera.zoom,sy=(this.y-camera.y)*camera.zoom;return Math.sqrt((x-sx)**2+(y-sy)**2)<(this.radius+5)*camera.zoom;}
}

class Node {
    constructor(id,x,y,ownerId,type='medium'){
        this.id=id;this.x=x;this.y=y;this.owner=ownerId;this.type=type;
        if(type==='small'){this.radius=35;this.influenceRadius=90;this.baseHp=8;this.maxHp=60;this.spawnInterval=2.0;}
        else if(type==='large'){this.radius=70;this.influenceRadius=150;this.baseHp=15;this.maxHp=150;this.spawnInterval=3.5;}
        else{this.radius=55;this.influenceRadius=120;this.baseHp=10;this.maxHp=100;this.spawnInterval=2.5;}
        this.defendersInside=0;this.selected=false;this.hasSpawnedThisCycle=false;this.rallyPoint=null;
    }
    getColor(){return this.owner===-1?'#757575':PLAYER_COLORS[this.owner%PLAYER_COLORS.length];}
    setRallyPoint(x,y){this.rallyPoint={x,y};}
    calculateDefenders(entities){
        this.defendersInside=0;
        for(let e of entities){
            if(e.dead||e.dying)continue;
            const dx=e.x-this.x,dy=e.y-this.y;
            if(Math.sqrt(dx*dx+dy*dy)<=this.influenceRadius&&e.owner===this.owner)this.defendersInside++;
        }
    }
    getTotalHp(){return Math.min(this.maxHp,this.baseHp+this.defendersInside);}
    receiveAttack(attackerId,damage){
        const defendersToKill=Math.min(this.defendersInside,damage);
        if(defendersToKill>0){this.defendersInside-=defendersToKill;damage-=defendersToKill;}
        if(damage>0){
            this.baseHp-=damage;
            if(this.baseHp<=0){
                this.owner=attackerId;
                this.baseHp=this.type==='small'?8:this.type==='large'?15:10;
                this.hasSpawnedThisCycle=false;
                return true;
            }
        }
        return false;
    }
    update(dt,entities,globalSpawnTimer){
        this.calculateDefenders(entities);
        if(this.owner!==-1&&globalSpawnTimer.shouldSpawn&&!this.hasSpawnedThisCycle){
            this.hasSpawnedThisCycle=true;
            const angle=Math.random()*Math.PI*2,dist=this.radius+25+Math.random()*40;
            const ex=this.x+Math.cos(angle)*dist,ey=this.y+Math.sin(angle)*dist;
            const entity=new Entity(ex,ey,this.owner,Date.now()+Math.random());
            if(this.rallyPoint)entity.setTarget(this.rallyPoint.x,this.rallyPoint.y);
            return entity;
        }
        if(!globalSpawnTimer.shouldSpawn)this.hasSpawnedThisCycle=false;
        return null;
    }
    draw(ctx,camera,entities){
        const sx=(this.x-camera.x)*camera.zoom,sy=(this.y-camera.y)*camera.zoom,sr=this.radius*camera.zoom,sir=this.influenceRadius*camera.zoom;
        this.calculateDefenders(entities);
        let defenderCounts={};
        for(let e of entities){
            if(e.dead||e.dying)continue;
            const dx=e.x-this.x,dy=e.y-this.y;
            if(Math.sqrt(dx*dx+dy*dy)<=this.influenceRadius)defenderCounts[e.owner]=(defenderCounts[e.owner]||0)+1;
        }
        let maxDefenders=0,dominantOwner=-1;
        for(let owner in defenderCounts){if(defenderCounts[owner]>maxDefenders){maxDefenders=defenderCounts[owner];dominantOwner=parseInt(owner);}}
        let areaColor;
        if(dominantOwner===-1||maxDefenders===0){const c=this.getColor().slice(1);areaColor=[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)].join(',');}
        else{const c=PLAYER_COLORS[dominantOwner%PLAYER_COLORS.length].slice(1);areaColor=[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)].join(',');}
        ctx.beginPath();ctx.arc(sx,sy,sir,0,Math.PI*2);ctx.fillStyle=`rgba(${areaColor},0.1)`;ctx.fill();ctx.strokeStyle=`rgba(${areaColor},0.4)`;ctx.lineWidth=2*camera.zoom;ctx.stroke();
        if(this.rallyPoint&&this.owner!==-1){
            const rx=(this.rallyPoint.x-camera.x)*camera.zoom,ry=(this.rallyPoint.y-camera.y)*camera.zoom;
            ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(rx,ry);ctx.strokeStyle=`rgba(${areaColor},0.4)`;ctx.setLineDash([3*camera.zoom,3*camera.zoom]);ctx.stroke();ctx.setLineDash([]);
            ctx.beginPath();ctx.arc(rx,ry,5*camera.zoom,0,Math.PI*2);ctx.fillStyle=`rgba(${areaColor},0.6)`;ctx.fill();
        }
        ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fillStyle=this.getColor();ctx.fill();ctx.strokeStyle=this.selected?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)';ctx.lineWidth=this.selected?3*camera.zoom:1*camera.zoom;ctx.stroke();
        const totalHp=this.getTotalHp(),maxHp=this.type==='small'?60:this.type==='large'?150:100,hpPercent=totalHp/maxHp,bw=sr*2,bh=5*camera.zoom;
        ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(sx-bw/2,sy+sr+8*camera.zoom,bw,bh);
        ctx.fillStyle=hpPercent>0.5?'#4CAF50':hpPercent>0.25?'#FFC107':'#f44336';ctx.fillRect(sx-bw/2,sy+sr+8*camera.zoom,bw*hpPercent
