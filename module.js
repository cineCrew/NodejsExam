exports.abs = function(number){
	if(0<number){
		return number;

	} else {
		return -number;
	}
};

exports.circleArea = function(radius){
	return radius * radius* Math.PI;
};

//---------------------------------------------------------
// master table
// log data
// 중복제거
// 용량 증대를 예방

// rdbms
// dw

// nosql
// 필요한 목적에 맞게 
// 사용방법이나 목적이 다 틀려요

// 뉴스테이블 / 댓글테이블 / 뉴스 - 댓글 
// 댓글이 계속 늘어나요 느려져요 
// rdbms에서 뉴스컨텐츠를 관리하고, (정보와 댓글을 분리해서 관리)
// nosql에 댓글을 저장 

// 컨텐츠 관리 ㅜ ㅜ    ;; 
//---------------------------------------------------------

// req, res nosqlserver
// scale-out 방식 
// a to z 

// mysql   - contents
// mongodb - logdata

//---------------------------------------------------------
// rdbms : 정합성이 장점이다.
// 분산처리서버는 대용량파일처리가 빠르지만 데이터 유실 등이 발생할 수 있다.

// DW .. (운영데이터 / 분석데이터 분리) ㅠㅠ

// transaction data traffic 




