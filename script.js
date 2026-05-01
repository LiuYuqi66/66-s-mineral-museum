let allMinerals = []; // 用于存放从 CSV 读取的所有矿物数据

// 1. 使用 PapaParse 读取本地的 minerals.csv
Papa.parse("minerals.csv", {
    download: true, // 允许读取本地文件
    header: true,   // 把第一行作为列名
    skipEmptyLines: true, // 跳过空行
    complete: function(results) {
        allMinerals = results.data; // 把读取到的数据存起来
        console.log("成功读取的数据:", allMinerals); // 在后台打印一下看看
        initWebsite(); // 数据读取成功后，启动网站
    },
    error: function(error) {
        console.error("读取CSV失败:", error);
        alert("找不到 minerals.csv 文件，或者文件格式不对！");
    }
});

// 2. 网站初始化总指挥
function initWebsite() {
    populateFilters(); // 生成下拉菜单选项
    renderGallery(allMinerals); // 在页面上画出所有矿物图片
    setupModal(); // 设置点击弹窗功能
}

// 3. 提取产地和分类，生成下拉筛选菜单
function populateFilters() {
    const categorySelect = document.getElementById('category-filter');
    const locationSelect = document.getElementById('location-filter');

    let categories = new Set();
    let locations = new Set();

    allMinerals.forEach(min => {
        // 去除空格，防止出现同样的分类被识别成两个
        let cat = min['矿物分类'] ? min['矿物分类'].trim() : "";
        let loc = min['产地'] ? min['产地'].trim() : "";
        if(cat) categories.add(cat);
        if(loc) locations.add(loc);
    });

    categories.forEach(cat => {
        let option = document.createElement('option');
        option.value = cat; option.textContent = cat;
        categorySelect.appendChild(option);
    });

    locations.forEach(loc => {
        let option = document.createElement('option');
        option.value = loc; option.textContent = loc;
        locationSelect.appendChild(option);
    });

    categorySelect.addEventListener('change', filterMinerals);
    locationSelect.addEventListener('change', filterMinerals);
}

// 4. 根据条件筛选矿物
function filterMinerals() {
    const selectedCategory = document.getElementById('category-filter').value;
    const selectedLocation = document.getElementById('location-filter').value;

    const filtered = allMinerals.filter(min => {
        let cat = min['矿物分类'] ? min['矿物分类'].trim() : "";
        let loc = min['产地'] ? min['产地'].trim() : "";
        
        const matchCategory = (selectedCategory === 'all' || cat === selectedCategory);
        const matchLocation = (selectedLocation === 'all' || loc === selectedLocation);
        return matchCategory && matchLocation;
    });

    renderGallery(filtered);
}

// 5. 在网页上画出图片墙 (加强版，防崩溃)
function renderGallery(mineralsToRender) {
    const gallery = document.getElementById('mineral-gallery');
    gallery.innerHTML = ''; // 清空之前的图片

    mineralsToRender.forEach(min => {
        // 如果连名字都没有，直接跳过这一行（防止表格底部的空行报错）
        if (!min['中文名称']) return;

        const card = document.createElement('div');
        card.className = 'mineral-card';
        card.onclick = () => openModal(min);

        // 安全地获取图片文件名
        let rawFileName = String(min['图片文件名'] || min['编号'] || 'missing'); 
        let imgFile = rawFileName.includes('.') ? rawFileName : rawFileName + '.jpg';
        
        card.innerHTML = `
            <img src="images/${imgFile}" alt="${min['中文名称']}" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            <div class="card-info">
                <div class="id">#${min['编号'] || '-'}</div>
                <div class="name">${min['中文名称']}</div>
            </div>
        `;
        gallery.appendChild(card);
    });
}

// 全局变量，记录当前图片的放大倍数
let currentScale = 1; 

// 6. 弹窗功能控制 (加入缩放重置机制)
function setupModal() {
    const modal = document.getElementById('mineral-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalImg = document.getElementById('modal-img');

    // 关闭弹窗的动作
    function closeModal() {
        modal.style.display = "none";
        // 关键：关闭弹窗时，把图片缩放比例恢复到 1倍
        currentScale = 1;
        modalImg.style.transform = `scale(1)`;
    }

    closeBtn.onclick = closeModal;
    window.onclick = function(event) {
        if (event.target == modal) closeModal();
    }

    // 👇 核心：鼠标滚轮缩放功能
    modalImg.addEventListener('wheel', function(e) {
        e.preventDefault(); // 阻止滚动时整个网页跟着上下跑
        
        // 向上滚(负数)放大，向下滚(正数)缩小
        if (e.deltaY < 0) { currentScale += 0.2; } 
        else { currentScale -= 0.2; }
        
        // 限制放大倍数：最小 1 倍，最大 5 倍
        currentScale = Math.min(Math.max(1, currentScale), 5); 
        
        modalImg.style.transform = `scale(${currentScale})`;
    }, { passive: false });
}

// 7. 打开弹窗，把对应矿物的数据填进去
function openModal(min) {
    const modal = document.getElementById('mineral-modal');
    
    // 安全地获取图片文件名
    let rawFileName = String(min['图片文件名'] || min['编号'] || 'missing'); 
    let imgFile = rawFileName.includes('.') ? rawFileName : rawFileName + '.jpg';
    
    document.getElementById('modal-img').src = `images/${imgFile}`;
    
    // 填入详细数据
    let engName = min['英文名称'] ? ` / ${min['英文名称']}` : '';
    document.getElementById('modal-title').innerText = `${min['中文名称']}${engName}`;
    document.getElementById('modal-formula').innerText = min['化学式'] || '-';
    document.getElementById('modal-class').innerText = min['矿物分类'] || '-';
    document.getElementById('modal-locality').innerText = min['产地'] || '-';
    document.getElementById('modal-size').innerText = min['尺寸(cm)'] || min['尺寸(长宽高)'] || '-';
    document.getElementById('modal-weight').innerText = min['重量(g)'] || '-';

    modal.style.display = "block";
}
// ================= 板块二：读取并生成矿区足迹 =================

// 使用 PapaParse 读取 mining_trips.csv
Papa.parse("mining_trips.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
        console.log("成功读取矿区数据:", results.data);
        renderMiningTrips(results.data);
    },
    error: function(error) {
        console.log("暂时没有找到 mining_trips.csv，或者文件有误。");
    }
});

// 在网页上生成矿区行
function renderMiningTrips(trips) {
    const container = document.getElementById('trips-container');
    container.innerHTML = ''; // 清空占位

    trips.forEach(trip => {
        if (!trip['矿区名称']) return; // 防空行崩溃

        const row = document.createElement('div');
        row.className = 'trip-row';

        // 1. 解析照片列表 (按逗号切割)
        let photosHtml = '';
        if (trip['照片列表']) {
            // 把 "1.jpg, 2.jpg" 切割成数组，并去掉多余空格
            const photoArray = trip['照片列表'].split(',').map(p => p.trim());
            photoArray.forEach(photo => {
                if(photo) {
                    photosHtml += `<img src="images/${photo}" onerror="this.style.display='none'">`;
                }
            });
        }

        // 2. 组装整行的 HTML
        row.innerHTML = `
            <div class="trip-header" onclick="toggleTripDetails(this)">
                <h3>📍 ${trip['矿区名称']}</h3>
                <span class="expand-hint">点击查看记录 ▼</span>
            </div>
            <div class="trip-gallery">
                ${photosHtml}
            </div>
            <div class="trip-details">
                <p><strong>地理位置：</strong>${trip['地理位置'] || '未知'}</p>
                <p><strong>探访时间：</strong>${trip['探访时间'] || '未知'}</p>
                <hr style="border:0; border-top:1px dashed #ddd; margin: 10px 0;">
                <p>${trip['详细记录'] || '暂无详细记录...'}</p>
            </div>
        `;
        container.appendChild(row);
    });

    // 3. 给所有的画廊加上“鼠标滚轮转横向滑动”的高级功能
    enableHorizontalScroll();
}

// 展开/折叠详细信息的开关
function toggleTripDetails(headerElement) {
    // 找到紧跟在 header 和 gallery 后面的 details 区块
    const detailsDiv = headerElement.parentElement.querySelector('.trip-details');
    const hintSpan = headerElement.querySelector('.expand-hint');
    
    if (detailsDiv.style.display === 'block') {
        detailsDiv.style.display = 'none';
        hintSpan.innerText = '点击查看记录 ▼';
    } else {
        detailsDiv.style.display = 'block';
        hintSpan.innerText = '收起记录 ▲';
    }
}

// 极其顺滑的体验：把普通的上下滚轮，变成画廊的左右滑动
function enableHorizontalScroll() {
    const galleries = document.querySelectorAll('.trip-gallery');
    galleries.forEach(gallery => {
        gallery.addEventListener('wheel', function(e) {
            // 如果鼠标停留在照片上滚动滚轮，禁止网页上下走，变成画廊左右走
            if (e.deltaY !== 0) {
                e.preventDefault(); 
                gallery.scrollLeft += e.deltaY;
            }
        }, { passive: false }); // 确保 preventDefault 能够生效
    });
}