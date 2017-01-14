class Vector {
    constructor(x, y) {
        this.x = x || 0
        this.y = y || 0
    }

    add(b) {
        this.x += b.x
        this.y += b.y
    }

    static add(a, b) {
        return new Vector(
            a.x + b.x,
            a.y + b.y)
    }

    sub(b) {
        this.x -= b.x
        this.y -= b.y
    }

    static sub(a, b) {
        return new Vector(
            a.x - b.x,
            a.y - b.y)
    }

    multiply(scalar) {
        this.x *= scalar
        this.y *= scalar
    }

    static multiply(a, scalar) {

        if (!a) {
            debugger
        }

        return new Vector(
            a.x * scalar,
            a.y * scalar)
    }

    normalize(length) {
        const len = Math.sqrt(this.x * this.x + this.y * this.y)
        const ratio = (length || 1) / len;

        this.x *= ratio
        this.y *= ratio
    }

    static normalize(a, length) {
        const len = Math.sqrt(this.x * this.x + this.y * this.y)
        const ratio = (length || 1) / len;

        return new Vector(
            a.x * ratio,
            a.y * ratio)
    }

    clone() {
        return new Vector(
            this.x,
            this.y)
    }

    random(maxX, maxY) {
        this.x = Math.random() * maxX
        this.y = Math.random() * maxY
    }

    static random(maxX, maxY) {
        return new Vector(
            Math.random() * maxX,
            Math.random() * maxY)
    }

    wrap(maxX, maxY) {
        this.x %= maxX
        this.y %= maxY

        while (this.x < 0) this.x += maxX
        while (this.y < 0) this.y += maxY
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    reset(x, y) {
        this.x = x || 0
        this.y = y || 0
    }

    toString() {
        return `x: ${this.x} y: ${this.y}`
    }
}

(() => {

    const getColor = () => `hsl(${Math.floor(Math.random() * 360)}, 42%, 56%)`
    const getColorAlpha = (opacity) => `hsla(${Math.floor(Math.random() * 360)}, 42%, 56%, ${opacity})`

    const canvas = document.getElementsByClassName('stage')[0]
    const ctx = canvas.getContext('2d')

    const numParticles = 0
    const maxVel = 100
    const zero = new Vector(0, 0)
    const bgColor = '#fafafa'
    const bgColorReset = '#fafafa'
    const forceField = [];
    const attractors = [];
    const particles = [];

    let stageWidth;
    let stageHeight;

    function initStageSize() {
        stageWidth = canvas.width = canvas.clientWidth
        stageHeight = canvas.height = canvas.clientHeight
    }

    function updateStageSize() {
        initStageSize()
        initForceField()
        updateForceField()
    }

    function initForceField() {
        const forceFieldLength = forceField.length
        for (let y = 0; y < stageHeight; y++) {
            for (let x = 0; x < stageWidth; x++) {
                const index = y * stageWidth + x
                if (forceFieldLength <= index) {
                    forceField[index] = Vector.sub(Vector.random(100, 100), new Vector(50, 50))
                } else {
                    const force = forceField[index]
                    force.random(100, 100)
                    force.sub(new Vector(50, 50))
                }
            }
        }
    }

    function updateForceField() {
        for (let y = 0; y < stageHeight; y++) {
            for (let x = 0; x < stageWidth; x++) {
                const index = y * stageWidth + x

                const force = forceField[index]
                force.reset()
                let isAttractor = false

                const attractorsLen = attractors.length
                for (let i = 0; i < attractorsLen; i++) {

                    const attractor = attractors[i]
                    const dPos = new Vector(x, y)
                    dPos.sub(attractor.pos)
                    const distance = dPos.magnitude()
                    const attraction = (-1 / dPos.magnitude()) * 1000
                    dPos.normalize(attraction)

                    isAttractor = isAttractor || distance <= 9
                    force.add(dPos)
                }

                force.isAttractor = isAttractor
            }
        }
    }

    function initAttractors() {
        for (let i = 0; i < 10; i++) {
            attractors.push({
                pos: new Vector(stageWidth * Math.random(), stageHeight * Math.random())
            })
        }
        updateForceField()
    }

    function addAttractor(event) {
        attractors.push({
            pos: new Vector(event.clientX, event.clientY)
        })
        updateForceField()
    }

    function initParticles() {
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                pos: Vector.random(stageWidth, stageHeight),
                vel: new Vector(0, 0),
                color: getColor()
            })
        }
    }

    function addParticle(pos, vel) {
        particles.push({
            pos: pos || new Vector(stageWidth / 4, stageHeight / 2),
            vel: vel || new Vector(Math.random() * 30 + 70, Math.random() * 10 - 5),
            color: getColor()
        })
    }

    function updateParticles(frameTime) {
        let particlesLen = particles.length
        for (let i = 0; i < particlesLen; i++) {
            const particle = particles[i]

            const x = Math.floor(particle.pos.x)
            const y = Math.floor(particle.pos.y)
            const index = y * stageWidth + x;

            const force = forceField[index]

            if (force.isAttractor) {
                /*
                particle.pos.random(stageWidth, stageHeight)
                particle.vel.reset()
                */

                particles.splice(i, 1)
                i--
                particlesLen--

            } else {
                particle.vel.add(Vector.multiply(force, frameTime))
                if (particle.vel.magnitude() > maxVel) {
                    particle.vel.normalize(maxVel)
                }

                particle.pos.add(Vector.multiply(particle.vel, frameTime))
                particle.pos.wrap(stageWidth, stageHeight)
            }
        }
    }

    class MouseListener {

        get posX() { return this._posX }
        get posY() { return this._posY }

        get velX() { return this._velX }
        get velY() { return this._velY }

        get dragging() { return this._dragging }

        constructor(canvas) {
            this._posX = 0
            this._posY = 0
            this._velX = 0
            this._velY = 0
            this._dragging = false

            canvas.addEventListener('pointerdown', e => this.down(e))
            canvas.addEventListener('pointermove', e => this.move(e))
            canvas.addEventListener('pointerup', e => this.up(e))
        }

        down(e) {
            // console.log('down')
            this._dragging = true
            this._posX = this._velX = e.clientX
            this._posY = this._velY = e.clientY
        }

        move(e) {
            // console.log('move')
            if (this._dragging) {
                this._velX = e.clientX
                this._velY = e.clientY
            }
        }

        up() {
            // console.log('up')
            if (this._dragging) {
                this._dragging = false

                const origin = new Vector(this._posX, this._posY)
                const drop = new Vector(this._velX, this._velY)
                const delta = Vector.sub(origin, drop)

                if (delta.magnitude() >= 10) {
                    console.log(`---| p:{${origin}} v:{${delta}} s:${delta.magnitude()} |---`)
                    addParticle(origin, delta)
                }
            }
        }
    }

    function render() {
        ctx.fillStyle = bgColorReset
        ctx.fillRect(0, 0, stageWidth, stageHeight)

        /*
        const gridResolution = 10
        ctx.strokeStyle = '#666'
        ctx.beginPath();
        for (let y = 0; y < stageHeight; y += gridResolution) {
            for (let x = 0; x < stageWidth; x += gridResolution) {
                const force = forceField[y * stageWidth + x]
                ctx.moveTo(x, y)
                ctx.lineTo(x + force.x / 5, y + force.y / 5)
            }
        }
        ctx.stroke();
        */

        const particlesLen = particles.length
        for (let i = 0; i < particlesLen; i++) {
            const particle = particles[i]

            ctx.fillStyle = particle.color
            ctx.fillRect(particle.pos.x - 1, particle.pos.y - 1, 3, 3)
        }

        const attractorsLen = attractors.length
        for (let i = 0; i < attractorsLen; i++) {
            const attractor = attractors[i]

            ctx.fillStyle = '#666'
            ctx.fillRect(attractor.pos.x - 9, attractor.pos.y - 9, 18, 18)
        }

        // console.log(mouseListener.dragging)
        if (mouseListener.dragging) {
            ctx.strokeStyle = getColor()
            ctx.beginPath();

            ctx.moveTo(mouseListener.posX, mouseListener.posY)
            ctx.lineTo(mouseListener.velX, mouseListener.velY)

            ctx.stroke();

            ctx.fillStyle = getColor()
            ctx.fillRect(mouseListener.posX - 1, mouseListener.posY - 1, 3, 3)
        }
    }

    let lastIteration = performance.now()
    function loop() {
        const curIteration = performance.now()
        const frameTime = Math.min(curIteration - lastIteration, 16) / 1000

        // console.log(`---| loop |---`)

        updateParticles(frameTime)
        render()

        lastIteration = curIteration
        requestAnimationFrame(loop)
    }

    window.addEventListener('resize', () => updateStageSize())
    // window.addEventListener('click', (e) => addAttractor(e))

    initStageSize()
    initForceField()
    initParticles()
    initAttractors()
    const mouseListener = new MouseListener(canvas);

    loop()

    // setInterval(addParticle, 100)

})();

