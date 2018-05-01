function Cloth(resolution, k, width) 
{
    
    this.resolution = resolution;
    this.vertices = [];
    this.forces = [];
    this.vel = [];
    this.width = width;
    this.step = width / (resolution - 1);
    this.vertex_count = resolution * resolution;
    this.k = k;
    this.indices = [];
    this.indCount = 6*(resolution-1)*(resolution-1)
    this.pos = [];
    this.externalForces = [];
    this.momentum = vec3();
    this.hasResist = false;
    
    this.gravity = vec3(0, -0.00001, 0);
    
    for (i=0; i<this.vertex_count; i++) 
    {
        this.forces.push(vec3(0,0,0));
        this.externalForces.push(vec3());
        this.vel.push(vec3());
        
        rawI = Math.floor(i / resolution);
        colI = i % resolution;
        
        v = vec3(colI*this.step - 0.5*width, rawI*this.step - 0.5* width, 0);
        this.vertices.push(v);
    }
    
    for (i = 0; i < this.indCount; i+=6)
	{
		index = Math.floor(i / 6);
		rawI = Math.floor(index / (resolution - 1));
		colI = index % (resolution - 1);

		upleft = rawI * (resolution) + colI;
		upright = rawI * (resolution) + (colI + 1);
		botleft = (rawI + 1) * (resolution) + colI;
		botright = (rawI + 1) * (resolution) + colI + 1;

		this.indices.push(upleft);
		this.indices.push(upright);
		this.indices.push(botleft);
		this.indices.push(upright);
		this.indices.push(botright);
		this.indices.push(botleft);
        
        this.pos.push(this.vertices[upleft]);   
        this.pos.push(this.vertices[upright]);
        this.pos.push(this.vertices[botleft]);
        this.pos.push(this.vertices[upright]);
        this.pos.push(this.vertices[botright]);
        this.pos.push(this.vertices[botleft]);
    }
    
    this.updateForces = function() 
    {
        for (i=0; i<this.vertex_count; i++) {
            rawI = Math.floor(i/this.resolution);
            colI = i%this.resolution;
            veri = this.vertices[i];
            
            //f = vec3();
            f = add(this.externalForces[i], this.gravity);
            if (this.hasResist) {
                f = subtract(f, scale(0.05, this.vel[i]));
            }
            for (j=-1;j<=1;j++) {
                for (k=-1;k<=1;k++) {
                    if ((j==0&&k==0) || j*k != 0 || rawI+j < 0 || colI+k<0 || rawI+j >= this.resolution || colI+k >= this.resolution) {
                        continue;
                    }
                    
                    tempi = (rawI+j)*this.resolution + colI+k;
                    rel = subtract(this.vertices[tempi], veri);
                    delta = length(rel) - this.step;
                    rel_n = normalize(rel);
                    rel_f = scale(delta, rel_n);
                    
                    f = add(f, rel_f);
                }
            }
            this.forces[i] = scale(this.k, f);
            //console.log(f);
            this.externalForces[i] = vec3();
        }
    }
    
    // Add random forces
    this.randomForce = function() 
    {
        for (i=0; i<this.vertex_count; i++) {
            if (Math.random() > 0.5) {
                this.externalForces[i][0] = Math.random() - 0.5;              
                this.externalForces[i][1] = Math.random() - 0.5;
                this.externalForces[i][2] = Math.random() - 0.5;
                
                this.externalForces[i] = scale(0.001, this.externalForces[i]);
            }
        }
    }

    this.updateVel = function() 
    {
        this.updateForces();
        momentum = vec3();
        for (i=0; i<this.vertex_count ;i++) {
            momentum[0] += this.forces[i][0];
            momentum[2] += this.forces[i][2];
        }
        //console.log(momentum);
        makeupMom = subtract(this.momentum, momentum);
        makeupMom = scale(1/this.vertex_count, makeupMom);
        
        for (i=0; i<this.vertex_count; i++) {
            this.forces[i][0] += makeupMom[0];
            this.forces[i][2] += makeupMom[2];
        }
        
        for (i=0; i<this.vertex_count ;i++) {
            this.vel[i] = add(this.vel[i],  this.forces[i]);
        }
        //console.log(momentum);
        this.momentum = vec3();
    }
    
    // Update position
    this.updatePos = function() 
    {
        this.updateVel();
        for (i=0; i<this.vertex_count - this.resolution; i++) {
            move = this.vel[i];
            this.vertices[i] = add(this.vertices[i], move);
        }
        
        for (i=0; i<this.indCount; i++) {
            this.pos[i] = this.vertices[this.indices[i]];
        }
    }
    
    // Simulate wind
    this.wind = function() 
    {
        for (i=0; i<this.vertex_count; i++) {
            momz = -0.0005 * Math.random();
            this.externalForces[i] = vec3(0, 0, momz);
            this.momentum[2] += momz;
        }
    }
}